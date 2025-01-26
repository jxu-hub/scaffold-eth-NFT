"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GiftIcon,
  ShoppingCartIcon,
  TrophyIcon,
  Bars3Icon,
  PhotoIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid"; // 使用更醒目的实心图标
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "铸造NFT",
    href: "/mintNFT",
    icon: <SparklesIcon className="h-5 w-5 text-cyan-300" />, // 突出显示的图标样式
  },
  {
    label: "我的NFT",
    href: "/myNFTs",
    icon: <PhotoIcon className="h-5 w-5 text-yellow-300" />,
  },
  // {
  //   label: "交易记录",
  //   href: "/transfers",
  //   icon: <ArrowPathIcon className="h-5 w-5 text-green-300" />,
  // },
  // {
  //   label: "上传到IPFS",
  //   href: "/ipfsUpload",
  //   icon: <ArrowUpTrayIcon className="h-5 w-5 text-purple-300" />,
  // },
  // {
  //   label: "从IPFS下载",
  //   href: "/ipfsDownload",
  //   icon: <ArrowDownTrayIcon className="h-5 w-5 text-red-300" />,
  // },
  // {
  //   label: "调试合约",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-5 w-5 text-blue-300" />,
  // },
  {
    label: "盲盒市场",
    href: "/blindBoxMarket",
    icon: <GiftIcon className="h-5 w-5 text-pink-300" />,
  },
  {
    label: "NFT市场",
    href: "/nftMarketplace",
    icon: <ShoppingCartIcon className="h-5 w-5 text-pink-300" />,
  },
  {
    label: "拍卖市场",
    href: "/auctionMarketplace",
    icon: <TrophyIcon className="h-5 w-5 text-indigo-300" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg" : ""
              } hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 hover:shadow-md focus:bg-gradient-to-r focus:from-pink-500 focus:to-purple-500 active:bg-gradient-to-r active:from-purple-600 active:to-blue-600 py-2 px-3 text-sm rounded-lg gap-2 grid grid-flow-col items-center`}
            >
              {icon}
              <span className="text-white">{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky top-0 navbar bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-700 min-h-0 flex-shrink-0 justify-between z-20 shadow-lg px-0 sm:px-4">
      <div className="navbar-start w-auto xl:w-2/3">
        <div className="xl:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-6 w-6 text-white" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link href="/" passHref className="flex items-center gap-2 ml-4 shrink-0">
          <div className="flex relative w-12 h-12">
            <Image alt="NFT Logo" className="rounded-full" fill src="/nft-logo.png" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-2xl leading-tight">NFT 宇宙</span>
            <span className="text-sm text-gray-200">探索数字艺术世界</span>
          </div>
        </Link>
        <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-3">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex items-center justify-end gap-4 mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
