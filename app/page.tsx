'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Search, Info, ExternalLink, Clock } from 'lucide-react';

// スプレッドシートのURL（Senaさんのもの！）
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1b4j8WbUOXqtR_ElBCDYIbKUZk-wfFprRHZuK-EESVig/export?format=csv";

export default function YouthIndex() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['すべて']);
  
  // 検索用の状態（State）
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [userAge, setUserAge] = useState(20);
  const [isStudent, setIsStudent] = useState('はい');

  // 最初だけスプレッドシートのデータを読み込む
  useEffect(() => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const rows = results.data.filter((row: any) => row['サービス名']); // 空の行を消す
        setData(rows);
        
        // カテゴリーのリストを作る
        const uniqueCategories = Array.from(new Set(rows.map((row: any) => row['カテゴリー']).filter(Boolean)));
        setCategories(['すべて', ...(uniqueCategories as string[])]);
      }
    });
  }, []);

  // データのふるい分け（フィルター）処理
  const filteredData = data.filter((row) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ① 期限切れチェック
    let isNotExpired = true;
    if (row['終了日']) {
      const expDate = new Date(row['終了日']);
      if (!isNaN(expDate.getTime()) && expDate < today) {
        isNotExpired = false;
      }
    }

    // ② 年齢・学生チェック
    const limitAge = parseInt(row['上限年齢']) || 99;
    const isAgeOk = userAge <= limitAge;
    const isStudentOk = isStudent === 'はい' || row['学生必須'] !== '〇'; // 〇の場合は学生のみ

    // ③ カテゴリー・文字検索チェック
    const isCategoryOk = selectedCategory === 'すべて' || row['カテゴリー'] === selectedCategory;
    const isSearchOk = searchQuery === '' || 
      (row['サービス名']?.includes(searchQuery) || row['カテゴリー']?.includes(searchQuery) || row['備考']?.includes(searchQuery));

    return isNotExpired && isAgeOk && isStudentOk && isCategoryOk && isSearchOk;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans px-4 py-8">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;700&family=Yesteryear&display=swap');
        body { font-family: 'Noto Sans JP', sans-serif; background-color: #fafafa; }
        .brand-title { font-family: 'Yesteryear', cursive; color: #111; font-size: 4rem; text-align: center; margin-bottom: 2rem; }
      `}} />

      <div className="max-w-3xl mx-auto">
        <h1 className="brand-title">YOUTH INDEX</h1>

        {/* 検索エリア */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="例：カラオケ、パソコン、引っ越し..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b8860b]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">分類</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">年齢</label>
              <input 
                type="number" min="12" max="30" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={userAge}
                onChange={(e) => setUserAge(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">学生</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1">
                  <input type="radio" name="student" checked={isStudent === 'はい'} onChange={() => setIsStudent('はい')} /> はい
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="student" checked={isStudent === 'いいえ'} onChange={() => setIsStudent('いいえ')} /> いいえ
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 結果表示エリア */}
        <h3 className="text-gray-500 mb-4">該当： {filteredData.length} 件</h3>

        {filteredData.length === 0 && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md border border-yellow-200">
            条件に合う割引が見つかりませんでした。
          </div>
        )}

        <div className="space-y-6">
          {filteredData.map((row, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="border border-gray-300 px-3 py-1 rounded-full text-xs tracking-wider">{row['カテゴリー']}</span>
                <span className="text-xs text-gray-500 tracking-wider">対象: {row['対象条件']}</span>
              </div>
              
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-xl font-bold text-gray-900 tracking-wide">{row['サービス名']}</h2>
                {row['終了日'] && (
                  <span className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded flex items-center gap-1">
                    <Clock size={12} /> {new Date(row['終了日']).toLocaleDateString('ja-JP')} まで！
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="line-through text-gray-500 text-sm">{row['通常料金']}</span>
                <span className="text-gray-600">➔</span>
                <span className="text-2xl font-bold text-[#b8860b]">{row['割引料金']}</span>
              </div>
              
              <div className="bg-[#b8860b]/5 border-l-2 border-[#b8860b] p-4 rounded-sm mb-4">
                <div className="text-[#b8860b] font-bold text-sm mb-2 flex items-center gap-1">
                  <Info size={16} /> 概要
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">{row['備考']}</div>
              </div>
              
              <div className="text-right text-xs text-gray-500 mb-4 tracking-wider">
                年間お得額の目安: <strong className="text-[#b8860b] font-bold text-sm">約 {Number(row['年間お得額'] || 0).toLocaleString()} 円</strong>
              </div>
              
              <a 
                href={row['公式URL']} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3 rounded border border-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                公式サイトへ <ExternalLink size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}