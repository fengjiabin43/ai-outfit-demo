import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

const SquareTab: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">校园广场</h1>
        
        {/* Post 1 */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6 border border-gray-100">
          <div className="relative">
             <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop" 
              className="w-full h-64 object-cover"
              alt="Post"
            />
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md p-1.5 rounded-full text-white">
               <MoreHorizontal size={16} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xs font-bold mb-1">@Sunny校友</p>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              <span className="text-orange-500 font-bold mr-1">#早八穿搭</span> 
              今天AI建议的叠穿真的绝了，舒服又显白！
            </p>
            
            {/* Social Actions */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
               <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart size={18} />
                    <span className="text-[10px] font-medium">1.2k</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageCircle size={18} />
                    <span className="text-[10px] font-medium">86</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors">
                    <Share2 size={18} />
                  </button>
               </div>
               <span className="text-[10px] text-gray-300">2小时前</span>
            </div>
          </div>
        </div>

        {/* Post 2 */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm mb-6 border border-gray-100">
          <div className="relative">
             <img 
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop" 
              className="w-full h-64 object-cover"
              alt="Post"
            />
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md p-1.5 rounded-full text-white">
               <MoreHorizontal size={16} />
            </div>
          </div>
          
          <div className="p-4">
             <div className="flex items-center gap-2 mb-3">
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop" 
                className="w-8 h-8 rounded-full border border-gray-100"
                alt="Avatar"
              />
              <span className="text-xs font-bold text-gray-800">Mark_Daily</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              <span className="text-orange-500 font-bold mr-1">#OOTD</span> 
              周末去美术馆的穿搭，灰色系真的很高级。
            </p>
            
             {/* Social Actions */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
               <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart size={18} />
                    <span className="text-[10px] font-medium">543</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageCircle size={18} />
                    <span className="text-[10px] font-medium">21</span>
                  </button>
                   <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-500 transition-colors">
                    <Share2 size={18} />
                  </button>
               </div>
               <span className="text-[10px] text-gray-300">5小时前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquareTab;