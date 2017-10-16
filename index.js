#!/usr/bin/env node

/**
 * https://github.com/SheetJS/js-xlsx/blob/master/bin/xlsx.njs
 */
'use strict'
const _ = require('lodash')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const X = require('xlsx')
var cmd = []
const OUTPUT_FILE = './terra_pinyin.taiwan.dict.yaml'
const PINYIN_DEBURR = [
  'àáèéìíòóùúüāēěīōūǎǐǒǔǘǚǜề',
  'aaeeiioouuuaeeiouaiouuuue'
]

cmd.terrapinyin = () => {
  const dictXlsxes = [
    './dict_revised/dict_revised_1.xls',
    './dict_revised/dict_revised_2.xls',
    './dict_revised/dict_revised_3.xls'
  ]

  let fout = fs.createWriteStream(OUTPUT_FILE)
  fout.write(`
# generate by https://github.com/taichunmin/taiwandict-to-terrapinyin
# author: taichunmin <taichunmin@gmail.com>
---
name: terra_pinyin.taiwan
version: "2017.10.13"
sort: by_weight
use_preset_vocabulary: true
...
`)
  let pinyinErrorCnt = 0
  let promises = _.map(
    dictXlsxes,
    dictXlsx => fs.accessAsync(dictXlsx, fs.constants.R_OK)
      .catch(e => {
        console.error('Can not access "' + dictXlsx + '" !')
        throw e
      })
      .then(() => X.readFile(dictXlsx))
      .then(wb => wb.Sheets[ wb.SheetNames[0] ])
      .catch(e => {
        console.error('failed to parsing ' + dictXlsx)
        throw e
      })
      .then(ws => X.utils.sheet_to_json(ws, {raw: true}))
      .then(rows => new Promise(resolve => {
        /*
         * [
         *   "字詞屬性",
         *   "字詞號",
         *   "字詞名",
         *   "部首字",
         *   "部首外筆畫數",
         *   "總筆畫數",
         *   "注音一式",
         *   "漢語拼音",
         *   "相似詞",
         *   "相反詞",
         *   "釋義",
         *   "編按",
         *   "多音參見訊息",
         *   "異體字"
         * ]
         */
        _.each(rows, row => {
          let word = cmd.stripNonCJK(_.get(row, ['字詞名'], ''))
          if (!word || ~word.indexOf('.')) return true
          // (變)
          _.each(['注音一式', '漢語拼音'], ik => {
            row[ik] = (row[ik] || '').split(/\(變\)|（變）/)
          })
          if (row['注音一式'].length !== row['漢語拼音'].length) {
            console.log('terrapinyin ERROR: ', JSON.stringify(row))
          }
          _.each(_.zip(row['注音一式'], row['漢語拼音']), tmp => {
            let zhuyins = _.trim(_.get(tmp, [0], '').replace(/\([^)]+\)|（[^）]+）/g, ' '))
            let pinyins = _.trim(_.get(tmp, [1], '').replace(/\([^)]+\)|（[^）]+）/g, ' '))
            let terra = cmd.zhuyinToTerraPinyin(zhuyins, pinyins)
            if (!_.isNil(terra)) {
              if (!/^[a-z0-9 ]*$/.test(terra)) {
                pinyinErrorCnt++
              }
              fout.write(word + (terra ? '\t' + terra : '') + '\n')
            }
          })
        })
        resolve()
      }))
  )

  return Promise.all(promises).then(() => {
    fout.end()
    if (pinyinErrorCnt > 0) {
      console.log('檔案內有 ' + pinyinErrorCnt + ' 個拼音錯誤。')
      let charUsed = {}
      _.each(cmd.terraPinyinCache, pinyin => {
        _.each(pinyin.split(''), ch => {
          if (!/^[a-z0-9]+$/.test(ch)) {
            charUsed[ch] = ''
          }
        })
      })
      console.log('請處理拼音內出現的非 ASCII 字元:', _.keys(charUsed).sort().join(''))
    }
    return fs.writeFileAsync('debug2.json', JSON.stringify(cmd.terraPinyinCache, null, 2))
  })
}

const mapTones = {'ˊ': 2, 'ˇ': 3, 'ˋ': 4, '˙': 5}
cmd.terraPinyinCache = {}
cmd.zhuyinToTerraPinyin = (zhuyins, pinyins) => {
  zhuyins = _.compact(zhuyins.split(/[　\s]+/)) // eslint-disable-line no-irregular-whitespace
  pinyins = _.compact(pinyins.split(/[　\s]+/)) // eslint-disable-line no-irregular-whitespace
  if (zhuyins.length !== pinyins.length) {
    console.log('zhuyinToTerraPinyin ERROR: ', JSON.stringify(zhuyins), ',', JSON.stringify(pinyins))
    return null
  }
  // console.log(JSON.stringify(zhuyins), JSON.stringify(pinyins), _.zip(zhuyins, pinyins))
  return _.map(_.zip(zhuyins, pinyins), row => {
    let zhuyin = row[0]
    let pinyin = row[1]
    let letterR = false
    if (/^.+ㄦ$/.test(zhuyin)) {
      letterR = true
      if (!pinyin) console.error(zhuyins, pinyins)
      zhuyin = zhuyin.replace(/ㄦ$/, '')
      pinyin = pinyin.replace(/r$/, '')
    }
    if (!_.has(cmd.terraPinyinCache, [zhuyin])) {
      let tone = 1
      if (_.startsWith(zhuyin, '˙')) tone = 5
      else if (zhuyin.length > 0) {
        let c = zhuyin[zhuyin.length - 1]
        tone = _.get(mapTones, [c], tone)
      }
      cmd.terraPinyinCache[zhuyin] = cmd.strtr(pinyin, PINYIN_DEBURR[0], PINYIN_DEBURR[1]) + tone
    }
    return cmd.terraPinyinCache[zhuyin] + (letterR ? ' er1' : '')
  }).join(' ')
}

const strtrCmp = (b, a) => (a.length !== b.length) ? a.length - b.length : (a > b ? 1 : -1)
cmd.strtrInit = (trFrom, trTo) => {
  if (typeof trFrom === 'object') {
    let tmpFrom = _.keys(trFrom).sort(strtrCmp)
    trTo = _.map(tmpFrom, fr => trFrom[fr])
    trFrom = tmpFrom
  }
  return [trFrom, trTo]
}

cmd.strtr = (str, trFrom, trTo) => {
  if (typeof trFrom === 'object') {
    let tmpFrom = _.keys(trFrom).sort(strtrCmp)
    trTo = _.map(tmpFrom, fr => trFrom[fr])
    trFrom = tmpFrom
  }
  let fromTypeStr = typeof trFrom === 'string'
  let lenFrom = trFrom.length
  let lenStr = str.length
  let toTypeStr = typeof trTo === 'string'
  var i = 0
  var istr = ''
  var j = 0
  var ret = ''
  let cacheSubstr = ''
  for (i = 0; i < lenStr; i++) {
    let match = false
    if (fromTypeStr) {
      istr = str.charAt(i)
      for (j = 0; j < lenFrom; j++) {
        if (istr === trFrom.charAt(j)) {
          match = true
          break
        }
      }
    } else {
      for (j = 0; j < lenFrom; j++) {
        if (trFrom[j].length === 0) continue
        if (cacheSubstr.length !== trFrom[j].length) {
          cacheSubstr = str.substr(i, trFrom[j].length)
        }
        if (cacheSubstr === trFrom[j]) {
          match = true
          // Fast forward
          i = (i + trFrom[j].length) - 1
          break
        }
      }
    }
    if (match) {
      ret += toTypeStr ? trTo.charAt(j) : trTo[j]
    } else {
      ret += str.charAt(i)
    }
  }
  return ret
}

cmd.stripNonCJK = str => {
  return str.replace(/[^\u4E00-\u9FFF\u3400-\u4DFF]/g, '')
}

// function should be add before this
if (require.main === module) {
  let fnName = process.argv[2]
  let args = process.argv.slice(3)

  if (!_.has(cmd, fnName)) throw new Error(fnName + "() doesn't exists.")
  let ret = cmd[fnName](...args)
  Promise.resolve(ret)
    .then(ret => console.log('Success:', _.isNil(ret) ? '' : ret))
    .catch(e => console.error('Error!', e))
    .finally(() => process.exit())
}
