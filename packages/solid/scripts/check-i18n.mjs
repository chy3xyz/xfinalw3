#!/usr/bin/env bun
// ============================================================
// i18n key-parity guard
//   bun run i18n:check   (from solid/)
//
// Fails when any locale under src/lib/i18n/ has a different key set
// than en.json (missing keys, or keys en.json does not have), when a
// value in another locale does not interpolate the same {placeholders}
// as its en.json counterpart, when a key referenced from src/** is
// absent from en.json, or when a value in zh-TW.json still contains a
// Simplified-only character.
// Bun-native (node: fs/path/url APIs via Bun).
// ============================================================
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const I18N_DIR = path.join(ROOT, "src", "lib", "i18n")
const SRC_DIR = path.join(ROOT, "src")
const CANONICAL = "en.json"

/** Flatten a nested message object into dotted paths -> string value. */
function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out)
    else out.set(key, v)
  }
  return out
}

function loadLocales() {
  const files = fs
    .readdirSync(I18N_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(I18N_DIR, file), "utf8")
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      console.error(`\u2716 ${file} is not valid JSON: ${err.message}`)
      process.exit(1)
    }
    return { file, keys: flatten(parsed) }
  })
}

/** Translation keys used in code: t('a.b'), tr("a.b"), i18n.t(`a.b`), useT()('a.b'). */
const CALL_RE =
  /\b(?:i18n\s*\.\s*)?(?:t|tr|translate)\s*\(\s*(?:'([^'\\]+)'|"([^"\\]+)"|`([^`$\\]+)`)/g
const KEY_SHAPE = /^[a-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/

// ------------------------------------------------------------
// zh-TW Simplified-character table
//
// ZH_TW_S2T maps Simplified-only characters to their Traditional
// (Taiwan) form. A zh-TW message fails the check below when any of its
// characters is a key of this table, i.e. when converting the value
// would change it.
//
// The first block is generated from OpenCC (Apache-2.0)
// data/dictionary/STCharacters.txt + TWVariants.txt, restricted to
// Simplified->Traditional pairs whose Traditional target differs from
// the source and to characters inside the CJK Unified Ideographs block.
// One entry is hand-corrected for Taiwan: 账→帳 (OpenCC gives 賬;
// Taiwan writes 帳戶 / 帳號 / 對帳).
// The final block adds characters OpenCC pairs with a rare Traditional
// homograph (so they are not strictly "Simplified-only" there) but that
// are Simplified-only in modern Taiwan usage:
//   确价荐挂据后于余划万极种虫丑丰党厂叶广柜淀筑胜腊腌蜡苹适杠杰愿亘仆
// Characters that are valid Traditional glyphs are deliberately NOT in
// the table, e.g. 台(平台) 只 系 制 面 里 松 干 布 准 采 游 几 厘 郁 象
// 谷 云 志 表 占 克 出 合 同 向 回 家. For the ones whose Simplified
// spelling is a whole word rather than a character (后/里/余/于/划/注/托/
// 制/系/松/干/采/面/台), ZH_TW_S2T_WORDS below supplies a word-level net.
// ------------------------------------------------------------
const ZH_TW_S2T_PAIRS =
  "与與专專业業丛叢东東丝絲丢丟两兩严嚴丧喪个個临臨为為丽麗举舉么麼义義乌烏乐樂乔喬习習乡鄉书書买買" +
  "乱亂争爭亏虧亚亞产產亩畝亲親亵褻亸嚲亿億仅僅从從仑侖仓倉仪儀们們众眾优優会會伛傴伞傘伟偉传傳伡俥" +
  "伣俔伤傷伥倀伦倫伧傖伪偽伫佇体體佥僉侠俠侣侶侥僥侦偵侧側侨僑侩儈侪儕侬儂侭儘俣俁俦儔俨儼俩倆俪儷" +
  "俫倈俭儉债債倾傾偬傯偻僂偾僨偿償傤儎傥儻傧儐储儲傩儺儿兒兑兌兖兗兰蘭关關兴興兹茲养養兽獸冁囅内內" +
  "冈岡册冊写寫军軍农農冯馮冲衝决決况況冻凍净淨凄悽凉涼减減凑湊凛凜凤鳳凫鳧凭憑凯凱击擊凿鑿刍芻刘劉" +
  "则則刚剛创創删刪别別刬剗刭剄刹剎刽劊刾㓨刿劌剀剴剂劑剐剮剑劍剥剝剧劇劝勸办辦务務劢勱动動励勵劲勁" +
  "劳勞势勢勋勳勚勩匀勻匦匭匮匱区區医醫华華协協单單卖賣卢盧卤滷卧臥卫衛却卻卺巹厅廳历歷厉厲压壓厌厭" +
  "厍厙厐龎厕廁厢廂厣厴厦廈厨廚厩廄厮廝县縣叁叄参參叆靉叇靆双雙发發变變叙敘叠疊号號叹嘆叽嘰吓嚇吕呂" +
  "吗嗎吨噸听聽启啟吴吳呐吶呒嘸呓囈呕嘔呖嚦呗唄员員呙咼呛嗆呜嗚咏詠咙嚨咛嚀咝噝咤吒响響哑啞哒噠哓嘵" +
  "哔嗶哕噦哗譁哙噲哜嚌哝噥哟喲唛嘜唝嗊唠嘮唡啢唢嗩唤喚啧嘖啬嗇啭囀啮齧啯嘓啰囉啴嘽啸嘯喷噴喽嘍喾嚳" +
  "嗫囁嗳噯嘘噓嘤嚶嘱囑噜嚕嚣囂团團园園囱囪围圍囵圇国國图圖圆圓圣聖圹壙场場坏壞块塊坚堅坛壇坜壢坝壩" +
  "坞塢坟墳坠墜垄壟垅壠垆壚垒壘垦墾垩堊垫墊垭埡垯墶垱壋垲塏垴堖埘塒埙壎埚堝堑塹堕墮塆壪墙牆壮壯声聲" +
  "壳殼壶壺壸壼处處备備复復够夠头頭夹夾夺奪奁奩奂奐奋奮奖獎奥奧妆妝妇婦妈媽妩嫵妪嫗妫媯姗姍姹奼娄婁" +
  "娅婭娆嬈娇嬌娈孌娱娛娲媧娴嫻婳嫿婴嬰婵嬋婶嬸媪媼媭嬃嫒嬡嫔嬪嫱嬙嬷嬤孙孫学學孪孿宁寧宝寶实實宠寵" +
  "审審宪憲宫宮宽寬宾賓寝寢对對寻尋导導寿壽将將尔爾尘塵尝嘗尧堯尴尷尽盡层層屃屓屉屜届屆属屬屡屢屦屨" +
  "屿嶼岁歲岂豈岖嶇岗崗岘峴岚嵐岛島岭嶺岽崬岿巋峃嶨峄嶧峡峽峣嶢峤嶠峥崢峦巒崂嶗崃崍崄嶮崭嶄嵘嶸嵚嶔" +
  "嵝嶁巅巔巩鞏巯巰币幣帅帥师師帏幃帐帳帜幟带帶帧幀帮幫帱幬帻幘帼幗幂冪并並庄莊庆慶庐廬庑廡库庫应應" +
  "庙廟庞龐废廢庼廎廪廩开開异異弃棄弑弒张張弥彌弪弳弯彎弹彈强強归歸当當录錄彟彠彦彥彨彲彻徹径徑徕徠" +
  "忆憶忏懺忧憂忾愾怀懷态態怂慫怃憮怄慪怅悵怆愴怜憐总總怼懟怿懌恋戀恒恆恳懇恶惡恸慟恹懨恺愷恻惻恼惱" +
  "恽惲悦悅悫愨悬懸悭慳悮悞悯憫惊驚惧懼惨慘惩懲惫憊惬愜惭慚惮憚惯慣愠慍愤憤愦憒慑懾慭憖懑懣懒懶懔懍" +
  "戆戇戋戔戏戲戗戧战戰戬戩戯戱户戶扑撲执執扩擴扪捫扫掃扬揚扰擾抚撫抛拋抟摶抠摳抡掄抢搶护護报報担擔" +
  "拟擬拢攏拣揀拥擁拦攔拧擰拨撥择擇挚摯挛攣挜掗挝撾挞撻挟挾挠撓挡擋挢撟挣掙挤擠挥揮挦撏捝挩捞撈损損" +
  "捡撿换換捣搗掳擄掴摑掷擲掸撣掺摻掼摜揽攬揾搵揿撳搀攙搁擱搂摟搄揯搅攪携攜摄攝摅攄摆擺摇搖摈擯摊攤" +
  "撄攖撑撐撵攆撷擷撸擼撺攛擜㩵擞擻攒攢敌敵敚敓敛斂敩斆数數斋齋斓斕斩斬断斷无無旧舊时時旷曠旸暘昙曇" +
  "昵暱昼晝昽曨显顯晋晉晒曬晓曉晔曄晕暈晖暉暂暫暧曖术術机機杀殺杂雜权權条條来來杨楊杩榪构構枞樅枢樞" +
  "枣棗枥櫪枧梘枨棖枪槍枫楓枭梟柠檸柽檉栀梔栅柵标標栈棧栉櫛栊櫳栋棟栌櫨栎櫟栏欄树樹栖棲样樣栾欒桠椏" +
  "桡橈桢楨档檔桤榿桥橋桦樺桧檜桨槳桩樁桪樳梦夢梼檮梾棶梿槤检檢棁梲棂欞椁槨椝槼椟櫝椠槧椢槶椤欏椫樿" +
  "椭橢椮槮楼樓榄欖榅榲榇櫬榈櫚榉櫸榝樧槚檟槛檻槟檳槠櫧横橫樯檣樱櫻橥櫫橱櫥橹櫓橼櫞檩檁欢歡欤歟欧歐" +
  "歼殲殁歿殇殤残殘殒殞殓殮殚殫殡殯殴毆毁毀毂轂毕畢毙斃毡氈毵毿氇氌气氣氢氫氩氬氲氳汇匯汉漢汤湯汹洶" +
  "沄澐沟溝没沒沣灃沤漚沥瀝沦淪沧滄沨渢沩溈沪滬泞濘泪淚泶澩泷瀧泸瀘泺濼泻瀉泼潑泽澤泾涇洁潔洒灑洼窪" +
  "浃浹浅淺浆漿浇澆浈湞浉溮浊濁测測浍澮济濟浏瀏浐滻浑渾浒滸浓濃浔潯浕濜涚涗涛濤涝澇涞淶涟漣涠潿涡渦" +
  "涢溳涣渙涤滌润潤涧澗涨漲涩澀渊淵渌淥渍漬渎瀆渐漸渑澠渔漁渖瀋渗滲温溫湾灣湿溼溁濚溃潰溅濺溆漵溇漊" +
  "滗潷滚滾滞滯滟灩滠灄满滿滢瀅滤濾滥濫滦灤滨濱滩灘滪澦潆瀠潇瀟潋瀲潍濰潜潛潴瀦澛瀂澜瀾濑瀨濒瀕灏灝" +
  "灭滅灯燈灵靈灾災灿燦炀煬炉爐炖燉炜煒炝熗点點炼煉炽熾烁爍烂爛烃烴烛燭烟煙烦煩烧燒烨燁烩燴烫燙烬燼" +
  "热熱焕煥焖燜焘燾煴熅爱愛爷爺牍牘牦犛牵牽牺犧犊犢状狀犷獷犸獁犹猶狈狽狝獮狞獰独獨狭狹狮獅狯獪狰猙" +
  "狱獄狲猻猃獫猎獵猕獼猡玀猪豬猫貓猬蝟献獻獭獺玑璣玙璵玚瑒玛瑪玮瑋环環现現玱瑲玺璽珐琺珑瓏珰璫珲琿" +
  "琎璡琏璉琐瑣琼瓊瑶瑤瑷璦瑸璸璎瓔瓒瓚瓮甕瓯甌电電画畫畅暢畴疇疖癤疗療疟瘧疠癘疡瘍疬癧疭瘲疮瘡疯瘋" +
  "疱皰疴痾痈癰痉痙痒癢痖瘂痨癆痪瘓痫癇瘅癉瘆瘮瘗瘞瘘瘻瘪癟瘫癱瘾癮瘿癭癞癩癣癬癫癲皑皚皱皺皲皸盏盞" +
  "盐鹽监監盖蓋盗盜盘盤眍瞘眦眥眬矓睁睜睐睞睑瞼瞆瞶瞒瞞瞩矚矫矯矶磯矾礬矿礦砀碭码碼砖磚砗硨砚硯砜碸" +
  "砺礪砻礱砾礫础礎硁硜硕碩硖硤硗磽硙磑硚礄硵磠碍礙碛磧碜磣碱鹼礼禮祃禡祎禕祢禰祯禎祷禱祸禍禀稟禄祿" +
  "禅禪离離秃禿秆稈积積称稱秽穢秾穠稆穭税稅稣穌稳穩穑穡穞穭穷窮窃竊窍竅窎窵窑窯窜竄窝窩窥窺窦竇窭窶" +
  "竖豎竞競笃篤笋筍笔筆笕筧笺箋笼籠笾籩筚篳筛篩筜簹筝箏筹籌筼篔签籤筿篠简簡箓籙箦簀箧篋箨籜箩籮箪簞" +
  "箫簫篑簣篓簍篮籃篯籛篱籬簖籪籁籟籴糴类類籼秈粜糶粝糲粤粵粪糞粮糧糁糝糇餱糍餈紧緊絷縶緼縕縆緪纟糹" +
  "纠糾纡紆红紅纣紂纤纖纥紇约約级級纨紈纩纊纪紀纫紉纬緯纭紜纮紘纯純纰紕纱紗纲綱纳納纴紝纵縱纶綸纷紛" +
  "纸紙纹紋纺紡纻紵纼紖纽紐纾紓线線绀紺绁紲绂紱练練组組绅紳细細织織终終绉縐绊絆绋紼绌絀绍紹绎繹经經" +
  "绐紿绑綁绒絨结結绔絝绕繞绖絰绗絎绘繪给給绚絢绛絳络絡绝絕绞絞统統绠綆绡綃绢絹绣繡绤綌绥綏绦絛继繼" +
  "绨綈绩績绪緒绫綾绬緓续續绮綺绯緋绰綽绱鞝绲緄绳繩维維绵綿绶綬绷繃绸綢绹綯绺綹绻綣综綜绽綻绾綰绿綠" +
  "缀綴缁緇缂緙缃緗缄緘缅緬缆纜缇緹缈緲缉緝缊縕缋繢缌緦缍綞缎緞缏緶缐線缑緱缒縋缓緩缔締缕縷编編缗緡" +
  "缘緣缙縉缚縛缛縟缜縝缝縫缞縗缟縞缠纏缡縭缢縊缣縑缤繽缥縹缦縵缧縲缨纓缩縮缪繆缫繅缬纈缭繚缮繕缯繒" +
  "缰韁缱繾缲繰缳繯缴繳缵纘罂罌网網罗羅罚罰罢罷罴羆羁羈羟羥羡羨翘翹翙翽翚翬耢耮耧耬耸聳耻恥聂聶聋聾" +
  "职職聍聹联聯聩聵聪聰肃肅肠腸肤膚肮骯肴餚肾腎肿腫胀脹胁脅胆膽胧朧胨腖胪臚胫脛胶膠脉脈脍膾脏髒脐臍" +
  "脑腦脓膿脔臠脚腳脱脫脶腡脸臉腘膕腭顎腻膩腼靦腽膃腾騰膑臏臜臢舆輿舣艤舰艦舱艙舻艫艰艱艳豔艺藝节節" +
  "芈羋芗薌芜蕪芦蘆苁蓯苇葦苈藶苋莧苌萇苍蒼苎苧苏蘇苧薴茎莖茏蘢茑蔦茔塋茕煢茧繭荆荊荙薘荚莢荛蕘荜蓽" +
  "荝萴荞蕎荟薈荠薺荡蕩荣榮荤葷荥滎荦犖荧熒荨蕁荩藎荪蓀荫蔭荬蕒荭葒荮葤药藥莅蒞莱萊莲蓮莳蒔莴萵莶薟" +
  "获獲莸蕕莹瑩莺鶯莼蓴萚蘀萝蘿萤螢营營萦縈萧蕭萨薩葱蔥蒀蒕蒇蕆蒉蕢蒋蔣蒌蔞蒏醟蓝藍蓟薊蓠蘺蓣蕷蓥鎣" +
  "蓦驀蔂虆蔷薔蔹蘞蔺藺蔼藹蕰薀蕲蘄蕴蘊薮藪藓蘚藴蘊蘖櫱虏虜虑慮虚虛虬虯虮蟣虱蝨虽雖虾蝦虿蠆蚀蝕蚁蟻" +
  "蚂螞蚃蠁蚕蠶蚬蜆蛊蠱蛎蠣蛏蟶蛮蠻蛰蟄蛱蛺蛲蟯蛳螄蛴蠐蜕蛻蜗蝸蝇蠅蝈蟈蝉蟬蝼螻蝾蠑螀螿螨蟎蟏蠨衅釁" +
  "衔銜补補衬襯衮袞袄襖袅嫋袆褘袜襪袭襲袯襏装裝裆襠裈褌裢褳裣襝裤褲裥襉褛褸褴襤襕襴见見观觀觃覎规規" +
  "觅覓视視觇覘览覽觉覺觊覬觋覡觌覿觍覥觎覦觏覯觐覲觑覷觞觴触觸觯觶訚誾詟讋誉譽誊謄讠訁计計订訂讣訃" +
  "认認讥譏讦訐讧訌讨討让讓讪訕讫訖讬託训訓议議讯訊记記讱訒讲講讳諱讴謳讵詎讶訝讷訥许許讹訛论論讻訩" +
  "讼訟讽諷设設访訪诀訣证證诂詁诃訶评評诅詛识識诇詗诈詐诉訴诊診诋詆诌謅词詞诎詘诏詔诐詖译譯诒詒诓誆" +
  "诔誄试試诖詿诗詩诘詰诙詼诚誠诛誅诜詵话話诞誕诟詬诠詮诡詭询詢诣詣诤諍该該详詳诧詫诨諢诩詡诪譸诫誡" +
  "诬誣语語诮誚误誤诰誥诱誘诲誨诳誑说說诵誦诶誒请請诸諸诹諏诺諾读讀诼諑诽誹课課诿諉谀諛谁誰谂諗调調" +
  "谄諂谅諒谆諄谇誶谈談谉讅谊誼谋謀谌諶谍諜谎謊谏諫谐諧谑謔谒謁谓謂谔諤谕諭谖諼谗讒谘諮谙諳谚諺谛諦" +
  "谜謎谝諞谞諝谟謨谠讜谡謖谢謝谣謠谤謗谥諡谦謙谧謐谨謹谩謾谪謫谫譾谬謬谭譚谮譖谯譙谰讕谱譜谲譎谳讞" +
  "谴譴谵譫谶讖豮豶贝貝贞貞负負贠貟贡貢财財责責贤賢败敗账帳货貨质質贩販贪貪贫貧贬貶购購贮貯贯貫贰貳" +
  "贱賤贲賁贳貰贴貼贵貴贶貺贷貸贸貿费費贺賀贻貽贼賊贽贄贾賈贿賄赀貲赁賃赂賂赃贓资資赅賅赆贐赇賕赈賑" +
  "赉賚赊賒赋賦赌賭赍齎赎贖赏賞赐賜赑贔赒賙赓賡赔賠赕賧赖賴赗賵赘贅赙賻赚賺赛賽赜賾赝贗赞贊赟贇赠贈" +
  "赡贍赢贏赣贛赪赬赵趙赶趕趋趨趱趲趸躉跃躍跄蹌跞躒践踐跶躂跷蹺跸蹕跹躚跻躋踌躊踪蹤踬躓踯躑蹑躡蹒蹣" +
  "蹰躕蹿躥躏躪躜躦躯軀輼轀车車轧軋轨軌轩軒轪軑轫軔转轉轭軛轮輪软軟轰轟轱軲轲軻轳轤轴軸轵軹轶軼轷軤" +
  "轸軫轹轢轺軺轻輕轼軾载載轾輊轿轎辀輈辁輇辂輅较較辄輒辅輔辆輛辇輦辈輩辉輝辊輥辋輞辌輬辍輟辎輜辏輳" +
  "辐輻辑輯辒轀输輸辔轡辕轅辖轄辗輾辘轆辙轍辚轔辞辭辩辯辫辮边邊辽遼达達迁遷过過迈邁运運还還这這进進" +
  "远遠违違连連迟遲迩邇迳逕迹跡选選逊遜递遞逦邐逻邏遗遺遥遙邓鄧邝鄺邬鄔邮郵邹鄒邺鄴邻鄰郏郟郐鄶郑鄭" +
  "郓鄆郦酈郧鄖郸鄲酂酇酝醞酦醱酱醬酽釅酾釃酿釀醖醞释釋鉴鑑銮鑾錾鏨钅釒钆釓钇釔针針钉釘钊釗钋釙钌釕" +
  "钍釷钎釺钏釧钐釤钑鈒钒釩钓釣钔鍆钕釹钖鍚钗釵钘鈃钙鈣钚鈈钛鈦钜鉅钝鈍钞鈔钟鍾钠鈉钡鋇钢鋼钣鈑钤鈐" +
  "钥鑰钦欽钧鈞钨鎢钩鉤钪鈧钫鈁钬鈥钭鈄钮鈕钯鈀钰鈺钱錢钲鉦钳鉗钴鈷钵缽钶鈳钷鉕钸鈽钹鈸钺鉞钻鑽钼鉬" +
  "钽鉭钾鉀钿鈿铀鈾铁鐵铂鉑铃鈴铄鑠铅鉛铆鉚铇鉋铈鈰铉鉉铊鉈铋鉍铌鈮铍鈹铎鐸铏鉶铐銬铑銠铒鉺铓鋩铔錏" +
  "铕銪铖鋮铗鋏铘鋣铙鐃铚銍铛鐺铜銅铝鋁铞銱铟銦铠鎧铡鍘铢銖铣銑铤鋌铥銩铦銛铧鏵铨銓铩鎩铪鉿铫銚铬鉻" +
  "铭銘铮錚铯銫铰鉸铱銥铲鏟铳銃铴鐋铵銨银銀铷銣铸鑄铹鐒铺鋪铻鋙铼錸铽鋱链鏈铿鏗销銷锁鎖锂鋰锃鋥锄鋤" +
  "锅鍋锆鋯锇鋨锈鏽锉銼锊鋝锋鋒锌鋅锍鋶锎鐦锏鐧锐銳锑銻锒鋃锓鋟锔鋦锕錒锖錆锗鍺锘鍩错錯锚錨锛錛锜錡" +
  "锝鍀锞錁锟錕锠錩锡錫锢錮锣鑼锤錘锥錐锦錦锧鑕锨鍁锩錈锪鍃锫錇锬錟锭錠键鍵锯鋸锰錳锱錙锲鍥锳鍈锴鍇" +
  "锵鏘锶鍶锷鍔锸鍤锹鍬锺鍾锻鍛锼鎪锽鍠锾鍰锿鎄镀鍍镁鎂镂鏤镃鎡镄鐨镅鎇镆鏌镇鎮镈鎛镉鎘镊鑷镋钂镌鐫" +
  "镍鎳镎鎿镏鎦镐鎬镑鎊镒鎰镓鎵镔鑌镕鎔镖鏢镗鏜镘鏝镙鏍镚鏰镛鏞镜鏡镝鏑镞鏃镟鏇镠鏐镡鐔镢钁镣鐐镤鏷" +
  "镥鑥镦鐓镧鑭镨鐠镩鑹镪鏹镫鐙镬鑊镭鐳镮鐶镯鐲镰鐮镱鐿镲鑔镳鑣镴鑞镵鑱镶鑲长長门門闩閂闪閃闫閆闬閈" +
  "闭閉问問闯闖闰閏闱闈闲閒闳閎间間闵閔闶閌闷悶闸閘闹鬧闺閨闻聞闼闥闽閩闾閭闿闓阀閥阁閣阂閡阃閫阄鬮" +
  "阅閱阆閬阇闍阈閾阉閹阊閶阋鬩阌閿阍閽阎閻阏閼阐闡阑闌阒闃阓闠阔闊阕闋阖闔阗闐阘闒阙闕阚闞阛闤队隊" +
  "阳陽阴陰阵陣阶階际際陆陸陇隴陈陳陉陘陕陝陦隯陧隉陨隕险險随隨隐隱隶隸隽雋难難雏雛雠讎雳靂雾霧霁霽" +
  "霉黴霡霢霭靄靓靚靔靝静靜靥靨鞑韃鞒鞽鞯韉鞲韝韦韋韧韌韨韍韩韓韪韙韫韞韬韜韵韻页頁顶頂顷頃顸頇项項" +
  "顺順须須顼頊顽頑顾顧顿頓颀頎颁頒颂頌颃頏预預颅顱领領颇頗颈頸颉頡颊頰颋頲颌頜颍潁颎熲颏頦颐頤频頻" +
  "颒頮颓頹颔頷颕頴颖穎颗顆题題颙顒颚顎颛顓颜顏额額颞顳颟顢颠顛颡顙颢顥颣纇颤顫颥顬颦顰颧顴风風飏颺" +
  "飐颭飑颮飒颯飓颶飔颸飕颼飖颻飗飀飘飄飙飆飚飈飞飛飨饗餍饜饣飠饤飣饥飢饦飥饧餳饨飩饩餼饪飪饫飫饬飭" +
  "饭飯饮飲饯餞饰飾饱飽饲飼饳飿饴飴饵餌饶饒饷餉饸餄饹餎饺餃饻餏饼餅饽餑饾餖饿餓馀餘馁餒馂餕馃餜馄餛" +
  "馅餡馆館馇餷馈饋馉餶馊餿馋饞馌饁馍饃馎餺馏餾馐饈馑饉馒饅馓饊馔饌馕饢马馬驭馭驮馱驯馴驰馳驱驅驲馹" +
  "驳駁驴驢驵駔驶駛驷駟驸駙驹駒驺騶驻駐驼駝驽駑驾駕驿驛骀駘骁驍骂罵骃駰骄驕骅驊骆駱骇駭骈駢骉驫骊驪" +
  "骋騁验驗骍騂骎駸骏駿骐騏骑騎骒騍骓騅骔騌骕驌骖驂骗騙骘騭骙騤骚騷骛騖骜驁骝騮骞騫骟騸骠驃骡騾骢驄" +
  "骣驏骤驟骥驥骦驦骧驤髅髏髋髖髌髕鬓鬢鬶鬹魇魘魉魎鱼魚鱽魛鱾魢鱿魷鲀魨鲁魯鲂魴鲃䰾鲄魺鲅鮁鲆鮃鲇鯰" +
  "鲈鱸鲉鮋鲊鮓鲋鮒鲌鮊鲍鮑鲎鱟鲏鮍鲐鮐鲑鮭鲒鮚鲓鮳鲔鮪鲕鮞鲖鮦鲗鰂鲘鮜鲙鱠鲚鱭鲛鮫鲜鮮鲝鮺鲞鯗鲟鱘" +
  "鲠鯁鲡鱺鲢鰱鲣鰹鲤鯉鲥鰣鲦鰷鲧鯀鲨鯊鲩鯇鲪鮶鲫鯽鲬鯒鲭鯖鲮鯪鲯鯕鲰鯫鲱鯡鲲鯤鲳鯧鲴鯝鲵鯢鲶鯰鲷鯛" +
  "鲸鯨鲹鰺鲺鯴鲻鯔鲼鱝鲽鰈鲾鰏鲿鱨鳀鯷鳁鰮鳂鰃鳃鰓鳄鱷鳅鰍鳆鰒鳇鰉鳈鰁鳉鱂鳊鯿鳋鰠鳌鰲鳍鰭鳎鰨鳏鰥" +
  "鳐鰩鳑鰟鳒鰜鳓鰳鳔鰾鳕鱈鳖鱉鳗鰻鳘鰵鳙鱅鳚䲁鳛鰼鳜鱖鳝鱔鳞鱗鳟鱒鳠鱯鳡鱤鳢鱧鳣鱣鳤䲘鸟鳥鸠鳩鸡雞" +
  "鸢鳶鸣鳴鸤鳲鸥鷗鸦鴉鸧鶬鸨鴇鸩鴆鸪鴣鸫鶇鸬鸕鸭鴨鸮鴞鸯鴦鸰鴒鸱鴟鸲鴝鸳鴛鸴鷽鸵鴕鸶鷥鸷鷙鸸鴯鸹鴰" +
  "鸺鵂鸻鴴鸼鵃鸽鴿鸾鸞鸿鴻鹀鵐鹁鵓鹂鸝鹃鵑鹄鵠鹅鵝鹆鵒鹇鷳鹈鵜鹉鵡鹊鵲鹋鶓鹌鵪鹍鵾鹎鵯鹏鵬鹐鵮鹑鶉" +
  "鹒鶊鹓鵷鹔鷫鹕鶘鹖鶡鹗鶚鹘鶻鹙鶖鹚鷀鹛鶥鹜鶩鹝鷊鹞鷂鹟鶲鹠鶹鹡鶺鹢鷁鹣鶼鹤鶴鹥鷖鹦鸚鹧鷓鹨鷚鹩鷯" +
  "鹪鷦鹫鷲鹬鷸鹭鷺鹮䴉鹯鸇鹰鷹鹱鸌鹲鸏鹳鸛鹴鸘鹾鹺麦麥麸麩麹麴麺麵麽麼黄黃黉黌黡黶黩黷黪黲黾黽鼋黿" +
  "鼌鼂鼍鼉鼹鼴齐齊齑齏齿齒龀齔龁齕龂齗龃齟龄齡龅齙龆齠龇齜龈齦龉齬龊齪龋齲龌齷龙龍龚龔龛龕龟龜鿎䃮" +
  "鿏䥑鿒鿓鿔鎶确確价價荐薦挂掛据據后後于於余餘划劃万萬极極种種虫蟲丑醜丰豐党黨厂廠叶葉广廣柜櫃淀澱" +
  "筑築胜勝腊臘腌醃蜡蠟苹蘋适適杠槓杰傑愿願亘亙仆僕"
const ZH_TW_S2T = new Map()
for (let i = 0; i < ZH_TW_S2T_PAIRS.length; i += 2) {
  ZH_TW_S2T.set(ZH_TW_S2T_PAIRS[i], ZH_TW_S2T_PAIRS[i + 1])
}

// Simplified spellings that use a character which is also a valid Traditional
// glyph on its own, so the character table cannot see them.
const ZH_TW_S2T_WORDS = [
  ["后台", "後台"],
  ["之后", "之後"],
  ["然后", "然後"],
  ["最后", "最後"],
  ["过后", "過後"],
  ["后面", "後面"],
  ["以后", "以後"],
  ["里面", "裡面"],
  ["这里", "這裡"],
  ["那里", "那裡"],
  ["里边", "裡邊"],
  ["计划", "計劃"],
  ["链接", "連結"],
  ["用于", "用於"],
  ["对于", "對於"],
  ["关于", "關於"],
  ["由于", "由於"],
  ["至于", "至於"],
  ["属于", "屬於"],
  ["余额", "餘額"],
  ["剩余", "剩餘"],
  ["其余", "其餘"],
  ["注册", "註冊"],
  ["注释", "註釋"],
  ["注明", "註明"],
  ["托管", "託管"],
  ["委托", "委託"],
  ["关系", "關係"],
  ["联系", "聯繫"],
  ["维系", "維繫"],
  ["制作", "製作"],
  ["制造", "製造"],
  ["放松", "放鬆"],
  ["轻松", "輕鬆"],
  ["松开", "鬆開"],
  ["干净", "乾淨"],
  ["干燥", "乾燥"],
  ["面条", "麵條"],
  ["面粉", "麵粉"],
  ["台风", "颱風"],
  ["游戏", "遊戲"],
  ["旅游", "旅遊"],
  ["采取", "採取"],
  ["采用", "採用"],
  ["采访", "採訪"],
  ["采购", "採購"],
  ["几个", "幾個"],
  ["几乎", "幾乎"],
  ["一只", "一隻"],
  ["两只", "兩隻"]
]

/** Simplified characters and words present in `value`, with their Traditional form. */
function simplifiedIn(value) {
  const chars = [...new Set([...value].filter((ch) => ZH_TW_S2T.has(ch)))].map(
    (ch) => `${ch}→${ZH_TW_S2T.get(ch)}`
  )
  const words = ZH_TW_S2T_WORDS.filter(([from]) => value.includes(from)).map(
    ([from, to]) => `${from}→${to}`
  )
  return [...chars, ...words]
}

/** `value` rewritten in Traditional Chinese (Taiwan), used to show the fix. */
function toTraditional(value) {
  let out = value
  for (const [from, to] of ZH_TW_S2T_WORDS) out = out.split(from).join(to)
  return [...out].map((ch) => ZH_TW_S2T.get(ch) ?? ch).join("")
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== "i18n") walk(p, out)
    } else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p)
  }
  return out
}

function collectCodeKeys() {
  const used = new Map()
  for (const file of walk(SRC_DIR)) {
    const text = fs.readFileSync(file, "utf8")
    CALL_RE.lastIndex = 0
    let m
    while ((m = CALL_RE.exec(text))) {
      const key = m[1] ?? m[2] ?? m[3]
      if (!KEY_SHAPE.test(key)) continue
      if (!used.has(key)) used.set(key, new Set())
      used.get(key).add(path.relative(ROOT, file))
    }
  }
  return used
}

function listSample(keys, limit = 20) {
  const shown = keys.slice(0, limit).map((k) => `    - ${k}`)
  if (keys.length > limit) shown.push(`    … and ${keys.length - limit} more`)
  return shown.join("\n")
}

const locales = loadLocales()
const canonical = locales.find((l) => l.file === CANONICAL)
if (!canonical) {
  console.error(
    `\u2716 ${CANONICAL} not found in ${path.relative(ROOT, I18N_DIR)}/`
  )
  process.exit(1)
}

const PLACEHOLDER_RE = /\{([A-Za-z0-9_]+)\}/g

/** The `{token}` names a message value interpolates (empty set for non-strings). */
function placeholders(value) {
  if (typeof value !== "string") return new Set()
  return new Set([...value.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))
}

/** `key: missing {a}; extra {b}` for a value whose tokens drifted, else null. */
function describePlaceholderDrift(key, want, got) {
  const missing = [...want].filter((t) => !got.has(t)).map((t) => `{${t}}`)
  const extra = [...got].filter((t) => !want.has(t)).map((t) => `{${t}}`)
  if (!missing.length && !extra.length) return null
  const parts = []
  if (missing.length) parts.push(`missing ${missing.join(", ")}`)
  if (extra.length) parts.push(`extra ${extra.join(", ")}`)
  return `${key}: ${parts.join("; ")}`
}

const problems = []
let placeholderDrift = 0
let placeholderPairs = 0

for (const loc of locales) {
  const missing = [...canonical.keys.keys()].filter((k) => !loc.keys.has(k))
  const extra = [...loc.keys.keys()].filter((k) => !canonical.keys.has(k))
  if (missing.length) {
    problems.push(
      `\u2716 src/lib/i18n/${loc.file} is missing ${missing.length} key(s) present in ${CANONICAL}:\n${listSample(missing)}`
    )
  }
  if (extra.length) {
    problems.push(
      `\u2716 src/lib/i18n/${loc.file} has ${extra.length} key(s) that ${CANONICAL} does not:\n${listSample(extra)}`
    )
  }
  // Placeholder parity: every locale value must interpolate exactly the same
  // {tokens} as its en.json counterpart. The canonical locale has nothing to
  // compare against, and a key this locale does not have at all is already
  // reported above — skip both instead of reading undefined.
  const drifted = []
  for (const [key, canonicalValue] of canonical.keys) {
    if (loc.file === CANONICAL || !loc.keys.has(key)) continue
    placeholderPairs += 1
    const line = describePlaceholderDrift(
      key,
      placeholders(canonicalValue),
      placeholders(loc.keys.get(key))
    )
    if (line) drifted.push(line)
  }
  if (drifted.length) {
    placeholderDrift += drifted.length
    problems.push(
      `\u2716 src/lib/i18n/${loc.file} has ${drifted.length} value(s) whose {placeholder} set differs from ${CANONICAL}:\n${listSample(drifted)}`
    )
  }
}

const codeKeys = collectCodeKeys()
const untracked = [...codeKeys.keys()]
  .filter((k) => !canonical.keys.has(k))
  .sort()
if (untracked.length) {
  problems.push(
    `\u2716 ${untracked.length} key(s) referenced in src/** are absent from ${CANONICAL}:\n` +
      untracked
        .map((k) => `    - ${k}  (${[...codeKeys.get(k)].join(", ")})`)
        .join("\n")
  )
}

// zh-TW must be fully Traditional: every value is converted with the
// character table and word list, and fails when the result differs.
// Exception: language names are shown in their own native script in every
// locale (en/ja/ko/… all keep `lang.zh-CN = 简体中文`), so those exact
// key/value pairs are exempt.
const NATIVE_SCRIPT_EXEMPT = new Map([
  ["lang.zh-CN", "简体中文"],
  ["lang.zh-TW", "繁體中文"]
])

const zhTW = locales.find((l) => l.file === "zh-TW.json")
const zhTWOffenders = []
if (zhTW) {
  for (const [key, value] of zhTW.keys) {
    if (typeof value !== "string") continue
    if (NATIVE_SCRIPT_EXEMPT.get(key) === value) continue
    const bad = simplifiedIn(value)
    if (!bad.length) continue
    zhTWOffenders.push(
      `    - ${key}: ${value}  →  ${toTraditional(value)}   [${bad.join(" ")}]`
    )
  }
  if (zhTWOffenders.length) {
    problems.push(
      `\u2716 src/lib/i18n/zh-TW.json has ${zhTWOffenders.length} value(s) containing Simplified-only characters:\n${zhTWOffenders.join("\n")}`
    )
  }
}

// ------------------------------------------------------------
// 文案长度护栏（防「又长回来」）
//
// 中文信息密度高，同一句话的英/泰/越南文字符数天然多得多 —— 阈值按语言区分。
// 现存的长文案登记在 scripts/i18n-length-baseline.json（键 → 当时长度）：
//   · 登记过的只能变短：超过登记长度 → FAIL（长度回归）
//   · 未登记的新文案：超过 fail 阈值 → FAIL；超过 warn 阈值 → 汇总里提示（不拦）
// 想放宽：压缩文案，或把该键登记进基线（等于承认它就该这么长）。
// ------------------------------------------------------------
const LENGTH_LIMITS = {
  "zh-CN.json": { warn: 90, fail: 130 },
  "zh-TW.json": { warn: 90, fail: 130 }
}
const LENGTH_LIMITS_DEFAULT = { warn: 260, fail: 700 }
const LENGTH_BASELINE_PATH = path.join(HERE, "i18n-length-baseline.json")
const lengthBaseline = fs.existsSync(LENGTH_BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(LENGTH_BASELINE_PATH, "utf8"))
  : {}

const lengthNew = [] // 未登记且超 fail
const lengthGrew = [] // 登记过但变长
const lengthWarn = [] // 超 warn（只提示）
for (const loc of locales) {
  const lim = LENGTH_LIMITS[loc.file] || LENGTH_LIMITS_DEFAULT
  const base = lengthBaseline[loc.file] || {}
  for (const [key, value] of loc.keys) {
    if (typeof value !== "string") continue
    const len = [...value].length
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      if (len > base[key])
        lengthGrew.push(`    - ${loc.file} ${key}: ${len} > 基线 ${base[key]}`)
      continue
    }
    if (len > lim.fail)
      lengthNew.push(`    - ${loc.file} ${key}: ${len} > ${lim.fail}`)
    else if (len > lim.warn) lengthWarn.push(`${loc.file} ${key}(${len})`)
  }
}
if (lengthNew.length) {
  problems.push(
    `\u2716 新增过长文案（未登记基线）—— 压缩，或登记进 scripts/i18n-length-baseline.json:\n${lengthNew.join("\n")}`
  )
}
if (lengthGrew.length) {
  problems.push(
    `\u2716 已压缩/登记过的文案又变长（长度回归）:\n${lengthGrew.join("\n")}`
  )
}

const counts = locales
  .map((l) => `${l.file.replace(/\.json$/, "")}=${l.keys.size}`)
  .join(" ")

if (problems.length) {
  console.error("i18n check failed\n")
  console.error(problems.join("\n\n"))
  console.error(`\nkey counts: ${counts}`)
  console.error(`reference: ${CANONICAL} (${canonical.keys.size} keys)`)
  process.exit(1)
}

console.log(
  `\u2714 i18n check passed — ${locales.length} locales × ${canonical.keys.size} keys`
)
console.log(`  ${counts}`)
console.log(
  `  code-referenced keys: ${codeKeys.size} (0 absent from ${CANONICAL})`
)
console.log(
  `  zh-TW Simplified-only scan: ${zhTWOffenders.length} of ${zhTW ? zhTW.keys.size : 0} values flagged (${ZH_TW_S2T.size} chars, ${ZH_TW_S2T_WORDS.length} words)`
)
console.log(
  `  placeholder parity scan: ${placeholderDrift} of ${placeholderPairs} values flagged (${locales.length - 1} locales vs ${CANONICAL})`
)
console.log(
  `  文案长度: 未登记超限 ${lengthNew.length} / 长度回归 ${lengthGrew.length}；超 warn（不拦）${lengthWarn.length}` +
    (lengthWarn.length ? ` — ${lengthWarn.slice(0, 3).join("、")}` : "")
)
