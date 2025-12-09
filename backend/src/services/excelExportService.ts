import ExcelJS from 'exceljs';
import { Workbook, Worksheet } from 'exceljs';
import { Project, Segment, Asset, User, ExportRequest, ExportHistory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import db from '@/config/database';

export class ExcelExportService {
  private readonly exportPath: string;

  constructor() {
    this.exportPath = process.env.EXCEL_EXPORT_PATH || './exports';
    this.ensureExportDirectory();
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportPath);
    } catch (error) {
      await fs.mkdir(this.exportPath, { recursive: true });
    }
  }

  async exportProject(
    request: ExportRequest,
    exportedBy: string
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const { project_id, export_type, include_comments = true, include_assets = true } = request;

    // Fetch project data
    const project = await this.fetchProjectData(project_id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Create workbook based on export type
    const workbook = new ExcelJS.Workbook();

    switch (export_type) {
      case 'DEVELOPER':
        await this.createDeveloperExport(workbook, project, include_comments, include_assets);
        break;
      case 'ARTIST':
        await this.createArtistExport(workbook, project, include_comments);
        break;
      case 'UPLOADER':
        await this.createUploaderExport(workbook, project);
        break;
      default:
        throw new Error('Invalid export type');
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${export_type}_${timestamp}.xlsx`;
    const filePath = path.join(this.exportPath, fileName);

    // Save workbook
    await workbook.xlsx.writeFile(filePath);

    // Get file size
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;

    // Save export history
    await this.saveExportHistory({
      id: uuidv4(),
      project_id,
      export_type,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      exported_by: exportedBy,
      created_at: new Date(),
    });

    return { filePath, fileName, fileSize };
  }

  private async createDeveloperExport(
    workbook: Workbook,
    project: any,
    includeComments: boolean,
    includeAssets: boolean
  ): Promise<void> {
    // Project Overview Sheet
    const overviewSheet = workbook.addWorksheet('项目概览');
    await this.createProjectOverview(overviewSheet, project);

    // Segments Sheet
    const segmentsSheet = workbook.addWorksheet('页面内容');
    await this.createSegmentsSheet(segmentsSheet, project.segments, 'DEVELOPER');

    // Assets Sheet
    if (includeAssets && project.assets.length > 0) {
      const assetsSheet = workbook.addWorksheet('素材清单');
      await this.createAssetsSheet(assetsSheet, project.assets);
    }

    // Comments Sheet
    if (includeComments && project.comments.length > 0) {
      const commentsSheet = workbook.addWorksheet('评论批注');
      await this.createCommentsSheet(commentsSheet, project.comments);
    }

    // Timeline Sheet
    const timelineSheet = workbook.addWorksheet('项目时间线');
    await this.createTimelineSheet(timelineSheet, project);
  }

  private async createArtistExport(
    workbook: Workbook,
    project: any,
    includeComments: boolean
  ): Promise<void> {
    // Artist Overview
    const overviewSheet = workbook.addWorksheet('美术需求概览');
    await this.createArtistOverview(overviewSheet, project);

    // Visual Assets Sheet - with rich text descriptions
    const assetsSheet = workbook.addWorksheet('视觉素材需求');
    await this.createArtistAssetsSheet(assetsSheet, project.assets);

    // Design References Sheet
    const designSheet = workbook.addWorksheet('设计说明');
    await this.createDesignSheet(designSheet, project.segments);

    // Comments Sheet (focused on design feedback)
    if (includeComments && project.comments.length > 0) {
      const commentsSheet = workbook.addWorksheet('设计反馈');
      await this.createDesignCommentsSheet(commentsSheet, project.comments);
    }
  }

  private async createUploaderExport(
    workbook: Workbook,
    project: any
  ): Promise<void> {
    // Upload Instructions Sheet
    const instructionsSheet = workbook.addWorksheet('上传说明');
    await this.createUploadInstructions(instructionsSheet, project);

    // Upload Checklist Sheet
    const checklistSheet = workbook.addWorksheet('上传清单');
    await this.createUploadChecklist(checklistSheet, project.assets);

    // File Mapping Sheet
    const mappingSheet = workbook.addWorksheet('文件映射');
    await this.createFileMapping(mappingSheet, project.segments, project.assets);
  }

  private async createProjectOverview(sheet: Worksheet, project: any): Promise<void> {
    // Set column widths
    sheet.columns = [
      { header: '项目信息', key: 'info', width: 20 },
      { header: '内容', key: 'content', width: 40 },
    ];

    // Add project data
    const overviewData = [
      { info: '项目标题', content: project.title },
      { info: '项目描述', content: project.description || '-' },
      { info: '创建者', content: project.creator.full_name },
      { info: '创建时间', content: project.created_at.toLocaleString('zh-CN') },
      { info: '项目状态', content: this.getProjectStatusText(project.status) },
      { info: '页面总数', content: project.segments.length },
      { info: '素材总数', content: project.assets.length },
    ];

    overviewData.forEach((row, index) => {
      sheet.addRow(row);
    });

    // Style the header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };
  }

  private async createSegmentsSheet(sheet: Worksheet, segments: any[], exportType: string): Promise<void> {
    // Set column widths
    sheet.columns = [
      { header: '页面序号', key: 'order', width: 12 },
      { header: '页面标题', key: 'title', width: 20 },
      { header: '模板类型', key: 'template', width: 15 },
      { header: '内容描述', key: 'content', width: 40 },
      { header: '设计说明', key: 'notes', width: 30 },
    ];

    // Add header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add segments data
    segments.forEach((segment, index) => {
      const row = sheet.addRow({
        order: index + 1,
        title: segment.title,
        template: segment.template?.name || '-',
        content: this.parseRichText(segment.content),
        notes: segment.notes || '-',
      });

      // Enable text wrapping for content and notes
      row.getCell(4).alignment = { wrapText: true, vertical: 'top' };
      row.getCell(5).alignment = { wrapText: true, vertical: 'top' };
    });

    // Add filters
    sheet.autoFilter = {
      from: 'A1',
      to: 'E1',
    };
  }

  private async createAssetsSheet(sheet: Worksheet, assets: any[]): Promise<void> {
    // Set column widths
    sheet.columns = [
      { header: '素材名称', key: 'name', width: 20 },
      { header: '类型', key: 'type', width: 12 },
      { header: '格式', key: 'format', width: 10 },
      { header: '尺寸', key: 'dimensions', width: 12 },
      { header: '描述', key: 'description', width: 30 },
      { header: '上传路径', key: 'uploadPath', width: 25 },
      { header: '状态', key: 'status', width: 10 },
    ];

    // Add header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add assets data
    assets.forEach(asset => {
      const row = sheet.addRow({
        name: asset.name,
        type: this.getAssetTypeText(asset.type),
        format: asset.format || '-',
        dimensions: asset.dimensions || '-',
        description: asset.description,
        uploadPath: asset.upload_instructions,
        status: this.getAssetStatusText(asset.status),
      });

      // Enable text wrapping for description
      row.getCell(5).alignment = { wrapText: true, vertical: 'top' };

      // Color code status
      if (asset.status === 'APPROVED') {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } };
      } else if (asset.status === 'UPLOADED') {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
      }
    });

    // Add filters
    sheet.autoFilter = {
      from: 'A1',
      to: 'G1',
    };
  }

  private async createArtistAssetsSheet(sheet: Worksheet, assets: any[]): Promise<void> {
    // Set column widths for artist-focused export
    sheet.columns = [
      { header: '素材名称', key: 'name', width: 20 },
      { header: '视觉类型', key: 'type', width: 12 },
      { header: '尺寸规格', key: 'dimensions', width: 12 },
      { header: '文件格式', key: 'format', width: 10 },
      { header: '设计要求', key: 'description', width: 40 },
      { header: '使用场景', key: 'usage', width: 20 },
      { header: '优先级', key: 'priority', width: 8 },
      { header: '状态', key: 'status', width: 10 },
    ];

    // Add header row with artist-friendly styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B6B' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Filter visual assets only
    const visualAssets = assets.filter(asset =>
      ['IMAGE', 'ANIMATION', 'VIDEO'].includes(asset.type)
    );

    visualAssets.forEach((asset, index) => {
      const row = sheet.addRow({
        name: asset.name,
        type: this.getAssetTypeText(asset.type),
        dimensions: asset.dimensions || '待定',
        format: asset.format || 'PNG',
        description: this.parseRichText(asset.description),
        usage: this.getAssetUsage(asset),
        priority: index < 5 ? '高' : index < 15 ? '中' : '低',
        status: this.getAssetStatusText(asset.status),
      });

      // Enable text wrapping for description
      row.getCell(5).alignment = { wrapText: true, vertical: 'top' };

      // Add priority color coding
      if (index < 5) {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } };
      } else if (index < 15) {
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
      }
    });

    // Add artist notes at the bottom
    const lastRow = sheet.rowCount + 2;
    sheet.getCell(`A${lastRow}`).value = '美术制作说明：';
    sheet.getCell(`A${lastRow}`).font = { bold: true };
    sheet.getCell(`B${lastRow}`).value = '1. 所有图片请使用RGB色彩模式';
    sheet.getCell(`B${lastRow + 1}`).value = '2. 背景图片需要预留文字显示区域';
    sheet.getCell(`B${lastRow + 2}`).value = '3. 角色设计需符合品牌风格指南';
    sheet.getCell(`B${lastRow + 3}`).value = '4. 动画时长控制在3-5秒内';
  }

  private async createUploadChecklist(sheet: Worksheet, assets: any[]): Promise<void> {
    // Set column widths for uploader-focused export
    sheet.columns = [
      { header: '序号', key: 'order', width: 8 },
      { header: '素材名称', key: 'name', width: 25 },
      { header: '文件类型', key: 'type', width: 10 },
      { header: '上传路径', key: 'path', width: 30 },
      { header: '文件命名规范', key: 'naming', width: 20 },
      { header: '已上传', key: 'uploaded', width: 10 },
    ];

    // Add header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '70AD47' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add assets as checklist
    assets.forEach((asset, index) => {
      const row = sheet.addRow({
        order: index + 1,
        name: asset.name,
        type: this.getAssetTypeText(asset.type),
        path: asset.upload_instructions,
        naming: this.generateNamingConvention(asset),
        uploaded: asset.status === 'UPLOADED' ? '✓' : '☐',
      });

      // Add checkbox functionality note
      if (asset.status !== 'UPLOADED') {
        row.getCell(6).font = { size: 16 };
      } else {
        row.getCell(6).font = { color: { argb: '00B050' }, size: 16 };
      }
    });

    // Add summary at the bottom
    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = '上传统计：';
    sheet.getCell(`A${summaryRow}`).font = { bold: true };

    const uploaded = assets.filter(a => a.status === 'UPLOADED').length;
    const total = assets.length;

    sheet.getCell(`B${summaryRow}`).value = `已完成：${uploaded}/${total} (${Math.round(uploaded/total*100)}%)`;
    sheet.getCell(`B${summaryRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
  }

  private parseRichText(htmlContent: string): string {
    if (!htmlContent) return '';

    // Simple HTML to text conversion
    // For rich text export, you might want to use a more sophisticated library
    return htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  private getProjectStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': '草稿',
      'IN_PROGRESS': '进行中',
      'REVIEW': '审核中',
      'COMPLETED': '已完成',
    };
    return statusMap[status] || status;
  }

  private getAssetTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      'IMAGE': '图片',
      'AUDIO': '音频',
      'VIDEO': '视频',
      'ANIMATION': '动画',
      'COMPONENT': '组件',
    };
    return typeMap[type] || type;
  }

  private getAssetStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': '待处理',
      'READY': '已就绪',
      'UPLOADED': '已上传',
      'APPROVED': '已批准',
    };
    return statusMap[status] || status;
  }

  private getAssetUsage(asset: any): string {
    // Determine usage context based on asset name and type
    if (asset.name.includes('背景') || asset.name.includes('bg')) {
      return '页面背景';
    } else if (asset.name.includes('按钮') || asset.name.includes('btn')) {
      return '交互按钮';
    } else if (asset.name.includes('标题') || asset.name.includes('header')) {
      return '页面标题';
    } else if (asset.type === 'AUDIO') {
      return '音效/配音';
    } else {
      return '内容素材';
    }
  }

  private generateNamingConvention(asset: any): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeMap: Record<string, string> = {
      IMAGE: 'img',
      AUDIO: 'aud',
      VIDEO: 'vid',
      ANIMATION: 'anim',
      COMPONENT: 'comp',
    };
    const typeCode = typeMap[String(asset.type)] || 'asset';

    return `${typeCode}_${asset.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
  }

  private async fetchProjectData(projectId: string): Promise<any> {
    // Fetch project with related data
    const project = await db('projects')
      .select('projects.*', 'users.full_name as creator_name', 'users.email as creator_email')
      .leftJoin('users', 'projects.created_by', 'users.id')
      .where('projects.id', projectId)
      .first();

    if (!project) return null;

    // Fetch segments
    const segments = await db('segments')
      .select('segments.*', 'templates.name as template_name')
      .leftJoin('templates', 'segments.template_id', 'templates.id')
      .where('segments.project_id', projectId)
      .orderBy('segments.order_index', 'asc');

    // Fetch assets
    const assets = await db('assets')
      .where('project_id', projectId)
      .orWhereIn('segment_id', segments.map(s => s.id));

    return {
      ...project,
      creator: {
        full_name: project.creator_name,
        email: project.creator_email,
      },
      segments,
      assets,
      comments: [], // TODO: Implement comments fetching
    };
  }

  private async saveExportHistory(history: ExportHistory): Promise<void> {
    await db('export_history').insert(history);
  }

  // Additional helper methods for other sheet types...
  private async createCommentsSheet(sheet: Worksheet, comments: any[]): Promise<void> {
    // Implementation for comments sheet
  }

  private async createTimelineSheet(sheet: Worksheet, project: any): Promise<void> {
    // Implementation for timeline sheet
  }

  private async createArtistOverview(sheet: Worksheet, project: any): Promise<void> {
    // Implementation for artist overview
  }

  private async createDesignSheet(sheet: Worksheet, segments: any[]): Promise<void> {
    // Implementation for design specifications
  }

  private async createDesignCommentsSheet(sheet: Worksheet, comments: any[]): Promise<void> {
    // Implementation for design-specific comments
  }

  private async createUploadInstructions(sheet: Worksheet, project: any): Promise<void> {
    // Implementation for upload instructions
  }

  private async createFileMapping(sheet: Worksheet, segments: any[], assets: any[]): Promise<void> {
    // Implementation for file mapping
  }
}
