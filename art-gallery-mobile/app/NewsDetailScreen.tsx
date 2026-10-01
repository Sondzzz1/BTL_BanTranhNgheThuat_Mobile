import React,{useEffect,useState} from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,ActivityIndicator} from 'react-native';
import {Article,newsService} from '../services/newsService';
import {resolveContentImageUrl} from '../services/artworkContentService';
import {formatVnd} from '../utils/currency';
import ArtworkImage from '../components/ArtworkImage';

export default function NewsDetailScreen({route,navigation}:any){
  const id=Number(route.params?.id);const[article,setArticle]=useState<Article|null>(null);const[related,setRelated]=useState<Article[]>([]);const[error,setError]=useState('');
  useEffect(()=>{setArticle(null);setError('');Promise.all([newsService.getArticleById(id),newsService.getRelated(id)]).then(([detail,items])=>{setArticle(detail);setRelated(items);}).catch((e)=>setError(e?.response?.status===404?'Bài viết không tồn tại hoặc chưa được xuất bản.':'Không thể tải bài viết.'));},[id]);
  const date=(v?:string)=>v?new Date(v).toLocaleString('vi-VN'):'';
  if(error)return <View style={s.center}><Text style={s.error}>{error}</Text></View>;
  if(!article)return <View style={s.center}><ActivityIndicator size="large" color="#ea580c"/></View>;
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.category}>{article.tenDanhMuc||'Góc nghệ thuật'}</Text><Text style={s.title}>{article.tieuDe}</Text>
    <Text style={s.meta}>Xuất bản {date(article.ngayXuatBan||article.ngayDang)} · {article.tenTacGia||article.tenHoaSi}</Text>
    {article.anhTieuDe?<ArtworkImage source={{uri:resolveContentImageUrl(article.anhTieuDe)}} style={s.hero}/>:null}
    {article.tomTat?<Text style={s.summary}>{article.tomTat}</Text>:null}<Text style={s.body}>{article.noiDung||''}</Text>
    {article.ngayBatDauSuKien?<View style={s.event}><Text style={s.sectionTitle}>Thông tin sự kiện</Text><Text>Bắt đầu: {date(article.ngayBatDauSuKien)}</Text>{article.ngayKetThucSuKien?<Text>Kết thúc: {date(article.ngayKetThucSuKien)}</Text>:null}{article.diaDiemSuKien?<Text>Địa điểm: {article.diaDiemSuKien}</Text>:null}</View>:null}
    {article.hinhAnhNoiDung?.length?<View><Text style={s.sectionTitle}>Hình ảnh trong bài</Text>{article.hinhAnhNoiDung.map(x=><View key={x.maHinhAnh} style={s.imageBlock}><ArtworkImage source={{uri:resolveContentImageUrl(x.duongDan)}} style={s.contentImage}/>{x.chuThich?<Text style={s.caption}>{x.chuThich}</Text>:null}</View>)}</View>:null}
    {article.nguonNoiDung?<Text style={s.source}>Nguồn tham khảo: {article.nguonNoiDung}</Text>:null}
    {article.tacPhamLienQuan?.length?<View><Text style={s.sectionTitle}>Tác phẩm được nhắc đến</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{article.tacPhamLienQuan.map(x=><TouchableOpacity key={x.maTacPham} style={s.artCard} onPress={()=>navigation.navigate('ProductDetail',{id:x.maTacPham})}><ArtworkImage source={x.hinhAnh?{uri:resolveContentImageUrl(x.hinhAnh)}:undefined} style={s.artImage}/><Text style={s.artTitle}>{x.tenTacPham}</Text><Text style={s.artPrice}>{formatVnd(x.gia)}</Text></TouchableOpacity>)}</ScrollView></View>:null}
    {related.length?<View><Text style={s.sectionTitle}>Bài viết liên quan</Text>{related.map(x=><TouchableOpacity key={x.maBaiViet} style={s.related} onPress={()=>navigation.push('NewsDetail',{id:x.maBaiViet})}><Text style={s.relatedTitle}>{x.tieuDe}</Text><Text style={s.meta}>{x.tenDanhMuc} · {date(x.ngayXuatBan||x.ngayDang)}</Text></TouchableOpacity>)}</View>:null}
  </ScrollView>;
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:'#fff'},content:{padding:18,paddingBottom:48},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},error:{color:'#b91c1c',textAlign:'center'},category:{color:'#ea580c',fontWeight:'800',textTransform:'uppercase'},title:{fontSize:28,fontWeight:'900',color:'#1f2937',lineHeight:35,marginVertical:10},meta:{color:'#9ca3af',fontSize:12},hero:{width:'100%',height:240,borderRadius:14,marginVertical:18},summary:{fontSize:17,fontWeight:'600',color:'#4b5563',lineHeight:25,marginBottom:14},body:{fontSize:16,color:'#374151',lineHeight:26},event:{backgroundColor:'#fff7ed',padding:15,borderRadius:12,marginTop:18,gap:5},sectionTitle:{fontSize:20,fontWeight:'800',color:'#7c2d12',marginTop:24,marginBottom:12},imageBlock:{marginBottom:15},contentImage:{width:'100%',height:230,borderRadius:12},caption:{textAlign:'center',color:'#6b7280',fontStyle:'italic',marginTop:6},source:{color:'#6b7280',fontSize:13,marginTop:18},artCard:{width:160,marginRight:12,backgroundColor:'#f8fafc',borderRadius:10,overflow:'hidden',paddingBottom:10},artImage:{width:160,height:110},artTitle:{fontWeight:'700',paddingHorizontal:9,paddingTop:8},artPrice:{color:'#ea580c',paddingHorizontal:9,marginTop:4},related:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#e5e7eb'},relatedTitle:{fontSize:16,fontWeight:'700',color:'#1f2937'}});
