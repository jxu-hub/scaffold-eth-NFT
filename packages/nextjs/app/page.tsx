"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";

const Home: NextPage = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-blue-900 text-white">
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[300%] h-[300%] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-[200px] animate-spin-slow"></div>
        <div className="absolute w-[200%] h-[200%] bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full blur-[150px] animate-spin-reverse-slower"></div>
      </div>

      {/* 页面内容 */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 flex items-center flex-col flex-grow pt-10"
      >
        <div className="px-5 w-[90%] md:w-[75%]">
          {/* 标题部分 */}
          <motion.h1
            className="text-center mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="block text-4xl mb-2 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500">
              NFT 宇宙探索
            </span>
            <span className="block text-2xl font-bold">炫酷的数字艺术之旅</span>
          </motion.h1>

          {/* 图片展示 */}
          <motion.div
            className="flex flex-col items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Image
              src="/nft-hero.png"
              width="727"
              height="231"
              alt="challenge banner"
              className="rounded-xl border-4 border-pink-500 shadow-lg"
            />

            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="max-w-3xl mt-8"
            >
              <p className="text-center text-lg">
                🎨 在这里，您可以铸造、收藏和交易专属于您的NFT，探索数字艺术的未来世界。
              </p>
              <p className="text-center text-lg mt-4">
                🌟 铸造您自己的NFT并将其发布到公开市场，与朋友分享或进行交易！🚀
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 底部按钮区 */}
      <motion.div
        className="relative z-10 flex justify-center gap-4 mt-12"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <button 
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-lg font-semibold hover:shadow-xl transition duration-300 transform hover:scale-105"
        onClick={() => {
          router.push("/mintNFT");
        }}
        >
          开始铸造
        </button>
        <button 
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full text-lg font-semibold hover:shadow-xl transition duration-300 transform hover:scale-105"
        onClick={() => {
          router.push("/nftMarketplace");
        }}
        >
          探索NFT市场
        </button>
      </motion.div>

      {/* 动画样式 */}
      <style jsx>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse-slower {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        .animate-spin-reverse-slower {
          animation: spin-reverse-slower 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
