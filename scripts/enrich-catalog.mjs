// 丰富站点标签与介绍：保留已有人工信息，为单标签条目补充相关标签与可读的服务说明。
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'data/sites.tsv';
const lines = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
const header = lines.shift();
const split = line => line.split('\t');
const tagMap = {
  '工具': ['效率工具', '在线服务'], '开发': ['编程开发', '效率工具'], 'AI': ['AI', '效率工具'],
  '设计': ['设计与创意', '效率工具'], '教育': ['在线学习', '效率工具'], '媒体': ['新闻资讯', '在线阅读'],
  '游戏': ['游戏', '社交媒体'], '出行': ['生活服务', '出行服务'], '音乐': ['音乐', '娱乐'],
  '汽车': ['汽车', '生活服务'], '金融': ['金融理财', '生活服务'], '社交': ['社交媒体', '在线服务'],
  '电商': ['电商购物', '生活服务'], '生活服务': ['生活服务', '效率工具'], '视频': ['视频与直播', '娱乐'],
  '电子': ['数码硬件', '科技'], '硬件': ['数码硬件', '科技'], '政务': ['政务', '生活服务'],
  '运动': ['运动户外', '生活服务'], '文具': ['文具', '效率工具'], '时尚': ['电商购物', '生活服务'],
  '科技': ['科技', '编程开发'], '阅读': ['在线学习', '在线阅读'], '摄影': ['设计与创意', '摄影']
};
const label = x => x.trim().replace(/[。；;]+$/g, '');
const domainOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
const rows = lines.map(line => {
  const c = split(line); while (c.length < 8) c.push('');
  const [short, full, cat, rawTags, brief, detail, url] = c;
  const tags = [];
  for (const t of rawTags.split(/[,，、;；|\s]+/)) if (label(t) && !tags.includes(label(t))) tags.push(label(t));
  for (const t of (tagMap[cat] || ['其他', '在线服务'])) if (!tags.includes(t)) tags.push(t);
  const domain = domainOf(url);
  const cleanBrief = label(brief);
  const cleanDetail = label(detail);
  const base = cleanBrief || `${short}官方网站`;
  const richer = cleanDetail.length >= 55 ? cleanDetail : `${base}。这里提供${full || short}的官方服务与相关信息，支持通过官网了解产品、功能、使用方式及最新动态；具体服务范围、开放地区和使用规则请以官方网站当前页面为准。${domain ? `官方网站：${domain}。` : ''}`;
  c[3] = tags.join(',');
  c[4] = cleanBrief || `${short}官方服务与信息入口`;
  c[5] = richer;
  return c.join('\t');
});
writeFileSync(file, [header, ...rows, ''].join('\n'), 'utf8');
console.log(`已丰富 ${rows.length} 条站点：补充多标签与详细介绍，保留已有较长文案。`);
