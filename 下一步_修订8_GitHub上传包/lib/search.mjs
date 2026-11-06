/** Reserved interface: no requests are made and no results are claimed as verified. */
export class DisabledSearchProvider {
  async search(_query){return {enabled:false,results:[],message:'联网检索尚未启用，请使用团队核实的路径资料。'};}
  async fetchPage(_url){return {enabled:false,content:null,message:'网页读取尚未启用。'};}
}
