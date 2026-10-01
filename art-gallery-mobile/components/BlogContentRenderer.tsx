import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BlogImage } from '../services/newsService';
import { resolveContentImageUrl } from '../services/artworkContentService';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'image'; imageId: number; caption?: string };

const isBlock = (value: unknown): value is Block => {
  if (!value || typeof value !== 'object') return false;
  const block = value as Record<string, unknown>;
  if (block.type === 'heading') return [2,3,4].includes(Number(block.level)) && typeof block.text === 'string';
  if (block.type === 'paragraph' || block.type === 'quote') return typeof block.text === 'string';
  if (block.type === 'image') return Number.isInteger(block.imageId) && Number(block.imageId) > 0 && (block.caption === undefined || typeof block.caption === 'string');
  if (block.type === 'list') return Array.isArray(block.items) && block.items.every(x => typeof x === 'string') && (block.ordered === undefined || typeof block.ordered === 'boolean');
  return false;
};

export function parseBlockContent(value?: string): { isBlockContent: boolean; blocks: Block[]; legacy: string } {
  if (!value?.trim()) return { isBlockContent: true, blocks: [], legacy: '' };
  try {
    const parsed = JSON.parse(value) as { version?: number; blocks?: Block[] };
    if (parsed.version === 1 && Array.isArray(parsed.blocks) && parsed.blocks.every(isBlock))
      return { isBlockContent: true, blocks: parsed.blocks, legacy: '' };
  } catch { /* Bài cũ được render an toàn như văn bản, không chạy HTML/script. */ }
  return { isBlockContent: false, blocks: [], legacy: legacyToText(value) };
}

export function blogExcerpt(value?: string): string {
  const parsed = parseBlockContent(value);
  if (!parsed.isBlockContent) return parsed.legacy;
  for (const block of parsed.blocks) {
    if ('text' in block && block.text.trim()) return block.text.trim();
    if (block.type === 'list' && block.items.length) return block.items.join(' · ');
  }
  return '';
}

const legacyToText = (value: string) => value
  .replace(/<\s*br\s*\/?\s*>/gi, '\n')
  .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\n{3,}/g, '\n\n').trim();

function BlockImage({ image, caption }: { image?: BlogImage; caption?: string }) {
  const [ratio, setRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(!image);
  if (!image || failed) return <View><View style={s.placeholder}><Text style={s.placeholderIcon}>▧</Text><Text style={s.placeholderText}>Ảnh đang được cập nhật</Text></View>{caption ? <Text style={s.caption}>{caption}</Text> : null}</View>;
  return <View style={s.imageBlock}><Image source={{ uri: resolveContentImageUrl(image.duongDan) }} style={[s.image, { aspectRatio: ratio }]} resizeMode="contain" onLoad={event => { const { width, height } = event.nativeEvent.source; if (width > 0 && height > 0) setRatio(width / height); }} onError={() => setFailed(true)} />{(caption || image.chuThich) ? <Text style={s.caption}>{caption || image.chuThich}</Text> : null}</View>;
}

export default function BlogContentRenderer({ content, images = [] }: { content?: string; images?: BlogImage[] }) {
  const parsed = useMemo(() => parseBlockContent(content), [content]);
  if (!content?.trim()) return null;
  if (!parsed.isBlockContent) return <Text style={s.paragraph}>{parsed.legacy}</Text>;
  return <View>{parsed.blocks.map((block, index) => {
    if (block.type === 'heading') return <Text key={index} style={block.level === 2 ? s.heading2 : block.level === 3 ? s.heading3 : s.heading4}>{block.text}</Text>;
    if (block.type === 'paragraph') return <Text key={index} style={s.paragraph}>{block.text}</Text>;
    if (block.type === 'quote') return <View key={index} style={s.quote}><Text style={s.quoteText}>{block.text}</Text></View>;
    if (block.type === 'list') return <View key={index} style={s.list}>{block.items.map((item, itemIndex) => <Text key={itemIndex} style={s.listItem}>{block.ordered ? `${itemIndex + 1}.` : '•'} {item}</Text>)}</View>;
    return <BlockImage key={index} image={images.find(x => x.maHinhAnh === block.imageId)} caption={block.caption} />;
  })}</View>;
}

const s = StyleSheet.create({
  heading2:{fontSize:23,fontWeight:'900',color:'#292524',lineHeight:30,marginTop:22,marginBottom:8},
  heading3:{fontSize:20,fontWeight:'800',color:'#292524',lineHeight:27,marginTop:18,marginBottom:7},
  heading4:{fontSize:17,fontWeight:'800',color:'#44403c',lineHeight:24,marginTop:15,marginBottom:6},
  paragraph:{fontSize:16,color:'#374151',lineHeight:26,marginBottom:12},
  quote:{borderLeftWidth:4,borderLeftColor:'#c08457',backgroundColor:'#fff7ed',padding:14,marginVertical:12,borderRadius:6},
  quoteText:{fontSize:16,fontStyle:'italic',color:'#57534e',lineHeight:25},list:{marginVertical:8},listItem:{fontSize:16,color:'#374151',lineHeight:25,marginBottom:4,paddingLeft:8},
  imageBlock:{marginVertical:16,width:'100%'},image:{width:'100%',backgroundColor:'#f3f4f6',borderRadius:12},
  caption:{textAlign:'center',color:'#6b7280',fontStyle:'italic',fontSize:13,marginTop:7},
  placeholder:{height:210,width:'100%',backgroundColor:'#e8e1d6',borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:12},
  placeholderIcon:{fontSize:32,color:'#8b7358'},placeholderText:{color:'#6f6252',marginTop:5},
});
