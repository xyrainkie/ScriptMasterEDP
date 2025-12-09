import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('assets').whereNotNull('template_id').del();
  await knex('templates').del();

  const templates = [
    {
      id: 't1',
      name: '互动场景 (Interactive Scene)',
      description: '用于创建具有交互功能的英语教学场景，支持点击、拖拽等互动元素',
      category: '交互式页面',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 't2',
      name: '视频教学 (Video Lesson)',
      description: '用于播放教学视频，支持字幕控制和播放进度跟踪',
      category: '视频页面',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 't3',
      name: '单词卡片 (Flashcards)',
      description: '用于展示单词卡片，支持正反面切换和发音功能',
      category: '单词学习',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 't4',
      name: '练习题目 (Practice Exercise)',
      description: '用于创建各种类型的练习题，支持选择题、填空题等',
      category: '练习测试',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 't5',
      name: '故事阅读 (Story Reading)',
      description: '用于展示绘本故事，支持图文并茂的阅读体验',
      category: '阅读理解',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  await knex('templates').insert(templates);

  // Template assets for Interactive Scene (t1)
  const interactiveSceneAssets = [
    {
      id: 'asset-t1-1',
      name: '背景图片',
      type: 'IMAGE',
      description: '场景大背景图片，需要明亮的色彩和清晰的场景设置',
      dimensions: '1920x1080',
      format: 'PNG',
      upload_instructions: 'assets/bg/',
      status: 'PENDING',
      template_id: 't1',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t1-2',
      name: '标题音频',
      type: 'AUDIO',
      description: '页面标题朗读音频，清晰标准的英语发音，语速适中',
      dimensions: '-',
      format: 'MP3',
      upload_instructions: 'assets/audio/',
      status: 'PENDING',
      template_id: 't1',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t1-3',
      name: '下一步按钮',
      type: 'COMPONENT',
      description: '通用导航按钮组件，支持点击交互和悬停效果',
      dimensions: '-',
      format: 'React',
      upload_instructions: 'components/NavBtn',
      status: 'PENDING',
      template_id: 't1',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t1-4',
      name: '交互元素',
      type: 'COMPONENT',
      description: '可点击的交互元素，支持动画效果和声音反馈',
      dimensions: '-',
      format: 'React',
      upload_instructions: 'components/InteractiveElement',
      status: 'PENDING',
      template_id: 't1',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  // Template assets for Video Lesson (t2)
  const videoLessonAssets = [
    {
      id: 'asset-t2-1',
      name: '教学视频',
      type: 'VIDEO',
      description: '核心讲解视频，时长3-5分钟，需要清晰的中英文字幕',
      dimensions: '1920x1080',
      format: 'MP4',
      upload_instructions: 'assets/video/',
      status: 'PENDING',
      template_id: 't2',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t2-2',
      name: '字幕文件',
      type: 'COMPONENT',
      description: 'SRT格式的字幕文件，包含中英双语字幕',
      dimensions: '-',
      format: 'SRT',
      upload_instructions: 'assets/subtitles/',
      status: 'PENDING',
      template_id: 't2',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  // Template assets for Flashcards (t3)
  const flashcardAssets = [
    {
      id: 'asset-t3-1',
      name: '卡片图片',
      type: 'IMAGE',
      description: '单词对应的图片，需要清晰展示单词含义',
      dimensions: '800x600',
      format: 'PNG',
      upload_instructions: 'assets/cards/',
      status: 'PENDING',
      template_id: 't3',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t3-2',
      name: '单词发音',
      type: 'AUDIO',
      description: '单词标准发音音频，美式发音，清晰标准',
      dimensions: '-',
      format: 'MP3',
      upload_instructions: 'assets/audio/',
      status: 'PENDING',
      template_id: 't3',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'asset-t3-3',
      name: '卡片容器',
      type: 'COMPONENT',
      description: '卡片翻转容器组件，支持3D翻转效果',
      dimensions: '-',
      format: 'React',
      upload_instructions: 'components/CardContainer',
      status: 'PENDING',
      template_id: 't3',
      created_by: 'user-admin-001',
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  await knex('assets').insert([...interactiveSceneAssets, ...videoLessonAssets, ...flashcardAssets]);
}