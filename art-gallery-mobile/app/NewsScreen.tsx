import React,{useEffect,useState} from 'react';
import {View,Text,StyleSheet,ScrollView,TouchableOpacity,TextInput,RefreshControl} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Article,BlogCategory,newsService} from '../services/newsService';
import {resolveContentImageUrl} from '../services/artworkContentService';
import ArtworkImage from '../components/ArtworkImage';

export default function NewsScreen({navigation}:any){
  const [articles,setArticles]=useState<Article[]>([]);const[categories,setCategories]=useState<BlogCategory[]>([]);
  const[keyword,setKeyword]=useState('');const[category,setCategory]=useState<number|undefined>();const[page,setPage]=useState(1);
  const[total,setTotal]=useState(0);const[loading,setLoading]=useState(false);const[refreshing,setRefreshing]=useState(false);
  const load=async(reset=false,requestedPage?:number)=>{const target=requestedPage??(reset?1:page);setLoading(true);try{const data=await newsService.getArticles({keyword:keyword.trim()||undefined,maDanhMuc:category,page:target,pageSize:8});setArticles(data.items);setTotal(data.total);setPage(target);}finally{setLoading(false);setRefreshing(false);}};
  useEffect(()=>{newsService.getCategories().then(setCategories).catch(console.error);load(true);},[category]);
  const format=(value?:string)=>value?new Date(value).toLocaleDateString('vi-VN'):'';
  return <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load(true);}} />}>
    <View style={s.hero}><Text style={s.heroTitle}>Góc nghệ thuật</Text><Text style={s.heroSub}>Bài viết đã được kiểm duyệt và xuất bản</Text></View>
    <View style={s.searchRow}><TextInput value={keyword} onChangeText={setKeyword} onSubmitEditing={()=>load(true)} placeholder="Tìm bài viết..." style={s.search}/><TouchableOpacity style={s.searchButton} onPress={()=>load(true)}><Ionicons name="search" size={20} color="#fff"/></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>
      <TouchableOpacity style={[s.chip,!category&&s.chipActive]} onPress={()=>setCategory(undefined)}><Text style={[s.chipText,!category&&s.chipTextActive]}>Tất cả</Text></TouchableOpacity>
      {categories.map(x=><TouchableOpacity key={x.maDanhMucBaiViet} style={[s.chip,category===x.maDanhMucBaiViet&&s.chipActive]} onPress={()=>setCategory(x.maDanhMucBaiViet)}><Text style={[s.chipText,category===x.maDanhMucBaiViet&&s.chipTextActive]}>{x.tenDanhMuc}</Text></TouchableOpacity>)}
    </ScrollView>
    <View style={s.list}>{articles.map(article=><TouchableOpacity key={article.maBaiViet} style={s.card} onPress={()=>navigation.navigate('NewsDetail',{id:article.maBaiViet})}>
      <ArtworkImage source={article.anhTieuDe?{uri:resolveContentImageUrl(article.anhTieuDe)}:undefined} style={s.image}/>
      <View style={s.body}><Text style={s.category}>{article.tenDanhMuc||'Góc nghệ thuật'}</Text><Text style={s.title}>{article.tieuDe}</Text><Text style={s.summary} numberOfLines={3}>{article.tomTat||article.noiDung||'Chưa có tóm tắt'}</Text><Text style={s.meta}>{format(article.ngayXuatBan||article.ngayDang)} · {article.tenTacGia||article.tenHoaSi}</Text></View>
    </TouchableOpacity>)}
    {!loading&&articles.length===0?<Text style={s.empty}>Không tìm thấy bài viết đã xuất bản.</Text>:null}
    <View style={s.pagination}><TouchableOpacity disabled={page<=1} onPress={()=>load(false,page-1)}><Text style={page<=1?s.disabled:s.pageLink}>‹ Trang trước</Text></TouchableOpacity><Text>Trang {page}</Text><TouchableOpacity disabled={page*8>=total} onPress={()=>load(false,page+1)}><Text style={page*8>=total?s.disabled:s.pageLink}>Trang sau ›</Text></TouchableOpacity></View>
    </View>
  </ScrollView>;
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:'#f8fafc'},hero:{backgroundColor:'#7c2d12',padding:28,alignItems:'center'},heroTitle:{fontSize:28,fontWeight:'800',color:'#fff'},heroSub:{color:'#fed7aa',marginTop:6},searchRow:{flexDirection:'row',padding:16,gap:8},search:{flex:1,backgroundColor:'#fff',borderWidth:1,borderColor:'#e5e7eb',borderRadius:10,paddingHorizontal:14},searchButton:{backgroundColor:'#ea580c',width:46,borderRadius:10,alignItems:'center',justifyContent:'center'},categories:{paddingHorizontal:16,gap:8,paddingBottom:8},chip:{paddingHorizontal:14,paddingVertical:8,borderRadius:20,backgroundColor:'#fff',borderWidth:1,borderColor:'#e5e7eb'},chipActive:{backgroundColor:'#ea580c',borderColor:'#ea580c'},chipText:{color:'#4b5563'},chipTextActive:{color:'#fff',fontWeight:'700'},list:{padding:16},card:{backgroundColor:'#fff',borderRadius:14,overflow:'hidden',marginBottom:16,elevation:2},image:{width:'100%',height:190},placeholder:{alignItems:'center',justifyContent:'center',backgroundColor:'#e5e7eb'},body:{padding:16},category:{fontSize:12,color:'#ea580c',fontWeight:'700',textTransform:'uppercase'},title:{fontSize:19,fontWeight:'800',color:'#1f2937',marginVertical:7},summary:{color:'#6b7280',lineHeight:20},meta:{color:'#9ca3af',fontSize:12,marginTop:12},empty:{textAlign:'center',color:'#6b7280',padding:30},pagination:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12},pageLink:{color:'#ea580c',fontWeight:'700'},disabled:{color:'#d1d5db'}});
