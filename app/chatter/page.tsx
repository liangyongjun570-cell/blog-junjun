import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ChatterBoard from './ChatterBoard';
import { siteConfig } from '@/siteConfig';


export const metadata = {
  title: "杂谈 | "+ siteConfig.title,
  description: "日常碎片与灵感记录",
};

// 剥掉 markdown 符号，输出纯文本预览（**加粗**、# 标题、`代码`、[链接](url) 等）
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/🔗/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export default function ChatterPage() {
  // 注意：这里我们假设你的 md 文件放在根目录的 chatters 文件夹里
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let chatters = [];

  try {
    // 确保文件夹存在
    if (!fs.existsSync(chattersDirectory)) {
      fs.mkdirSync(chattersDirectory);
    }

    const fileNames = fs.readdirSync(chattersDirectory).filter(fileName => fileName.endsWith('.md'));

    chatters = fileNames.map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(path.join(chattersDirectory, fileName), 'utf8');
      const { data, content } = matter(fileContents);

      // 提取正文里的来源链接（🔗 [名称](url)），从预览中剥离
      let source: { text: string; url: string } | null = null;
      let body = content;
      const srcMatch = body.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (srcMatch) {
        source = { text: srcMatch[1], url: srcMatch[2] };
        body = body.replace(srcMatch[0], '');
      }

      return {
        slug,
        title: data.title || '',
        date: data.date ? String(data.date) : '未知时间',
        tags: data.tags || [],
        mood: data.mood || '',
        cover: data.cover || '',
        source,
        content: stripMarkdown(body)
      };
    }).sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime())); // 按时间倒序
  } catch (e) {
    console.error("读取杂谈文件失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        {/* 将解析好的数据传递给客户端组件进行瀑布流渲染 */}
        <ChatterBoard chatters={chatters} />
      </PageTransition>
    </div>
  );
}