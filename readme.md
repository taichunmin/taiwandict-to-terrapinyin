# 臺灣教育部字典轉 Rime 地球拼音字典

將中華民國教育部《重編國語辭典修訂本》、《國語辭典簡編本》、《國語小字典》與《成語 典》轉換成 Rime 輸入法所接受的 Terra Pinyin 字典及我自己寫的 zhuyin_taichunmin。

## Usage

直接下載 `terra_pinyin.taiwan.dict.yaml`，並參照 <https://github.com/taichunmin/rime-settings> 使用。

## Generate

```
# terrapinyin
yarn terrapinyin
# zhuyin_taichunmin
yarn zhuyin_taichunmin
```

## dict_revised 聲明

公眾授權頁：<http://resources.publicense.moe.edu.tw/dict_reviseddict_download.html>

中華民國教育部《重編國語辭典修訂本》、《國語辭典簡編本》、《國語小字典》與《成語 典》相關資料採「創用CC-姓名標示- 禁止改作 臺灣3.0版授權條款」釋出 本授權條款允許使用者重製、散布、傳輸著作（包括商業性利用），但不得修改該著作，使用時必須遵照「使用說明」之內容要求。

依教育部之解釋，「創用CC-姓名標示- 禁止改作 臺灣3.0版授權條款」之改作限制標的為文字資料本身，不限制格式轉換及後續應用。

* Version: `dict_revised_2015_20160523`

## dict_revised 資料錯誤校正 2017/10/13

* dict_revised_1
  - 女孩兒 (漢語拼音缺「女」)
* dict_revised_2
  - 立人兒 (漢語拼音格式有誤)
  - 六龜 (漢語拼音多了「鄉」)
  - 林口 (漢語拼音多了「鄉」)
  - 蘆洲 (漢語拼音多了「鄉」)
  - 路竹 (漢語拼音多了「鄉」)
  - 貢寮 (漢語拼音多了「鄉」)
  - 后里 (漢語拼音多了「鄉」)
  - 後壁 (漢語拼音多了「鄉」)
