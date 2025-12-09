import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('course_preset_steps').del();
  await knex('course_presets').del();

  // Default course presets
  const coursePresets = [
    {
      id: 'cp1',
      name: '标准绘本课 (Standard Story)',
      description: '适用于绘本教学的标准课程流程，包含热身、故事讲解、练习和总结环节',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'cp2',
      name: '单词学习课 (Vocabulary Lesson)',
      description: '专注于单词学习的课程流程，包含单词展示、发音练习和应用练习',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'cp3',
      name: '互动游戏课 (Interactive Game)',
      description: '以游戏互动为主的课程形式，提高学生学习兴趣和参与度',
      created_by: 'user-admin-001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];

  await knex('course_presets').insert(coursePresets);

  // Course preset steps
  const presetSteps = [
    // Standard Story steps
    {
      id: 'cps1-1',
      title: '01. Warm-up 热身活动',
      template_id: 't2',
      preset_id: 'cp1',
      order_index: 1,
    },
    {
      id: 'cps1-2',
      title: '02. Story Introduction 故事介绍',
      template_id: 't1',
      preset_id: 'cp1',
      order_index: 2,
    },
    {
      id: 'cps1-3',
      title: '03. Story Reading 1 故事阅读第一部分',
      template_id: 't5',
      preset_id: 'cp1',
      order_index: 3,
    },
    {
      id: 'cps1-4',
      title: '04. Vocabulary Practice 词汇练习',
      template_id: 't3',
      preset_id: 'cp1',
      order_index: 4,
    },
    {
      id: 'cps1-5',
      title: '05. Story Reading 2 故事阅读第二部分',
      template_id: 't5',
      preset_id: 'cp1',
      order_index: 5,
    },
    {
      id: 'cps1-6',
      title: '06. Comprehension Check 理解检查',
      template_id: 't4',
      preset_id: 'cp1',
      order_index: 6,
    },
    {
      id: 'cps1-7',
      title: '07. Wrap-up 总结回顾',
      template_id: 't2',
      preset_id: 'cp1',
      order_index: 7,
    },

    // Vocabulary Lesson steps
    {
      id: 'cps2-1',
      title: '01. Review 复习环节',
      template_id: 't3',
      preset_id: 'cp2',
      order_index: 1,
    },
    {
      id: 'cps2-2',
      title: '02. New Words Presentation 新单词呈现',
      template_id: 't1',
      preset_id: 'cp2',
      order_index: 2,
    },
    {
      id: 'cps2-3',
      title: '03. Word Pronunciation 单词发音',
      template_id: 't3',
      preset_id: 'cp2',
      order_index: 3,
    },
    {
      id: 'cps2-4',
      title: '04. Word Meaning 单词释义',
      template_id: 't3',
      preset_id: 'cp2',
      order_index: 4,
    },
    {
      id: 'cps2-5',
      title: '05. Practice Exercise 练习题',
      template_id: 't4',
      preset_id: 'cp2',
      order_index: 5,
    },
    {
      id: 'cps2-6',
      title: '06. Application 应用练习',
      template_id: 't1',
      preset_id: 'cp2',
      order_index: 6,
    },
    {
      id: 'cps2-7',
      title: '07. Summary 总结',
      template_id: 't2',
      preset_id: 'cp2',
      order_index: 7,
    },

    // Interactive Game steps
    {
      id: 'cps3-1',
      title: '01. Game Introduction 游戏介绍',
      template_id: 't2',
      preset_id: 'cp3',
      order_index: 1,
    },
    {
      id: 'cps3-2',
      title: '02. Game Rules 游戏规则',
      template_id: 't1',
      preset_id: 'cp3',
      order_index: 2,
    },
    {
      id: 'cps3-3',
      title: '03. Practice Round 练习回合',
      template_id: 't1',
      preset_id: 'cp3',
      order_index: 3,
    },
    {
      id: 'cps3-4',
      title: '04. Game Play 游戏开始',
      template_id: 't1',
      preset_id: 'cp3',
      order_index: 4,
    },
    {
      id: 'cps3-5',
      title: '05. Score Check 得分检查',
      template_id: 't1',
      preset_id: 'cp3',
      order_index: 5,
    },
    {
      id: 'cps3-6',
      title: '06. Awards & Recognition 奖励与表彰',
      template_id: 't1',
      preset_id: 'cp3',
      order_index: 6,
    },
    {
      id: 'cps3-7',
      title: '07. Game Review 游戏回顾',
      template_id: 't2',
      preset_id: 'cp3',
      order_index: 7,
    }
  ];

  await knex('course_preset_steps').insert(presetSteps);
}