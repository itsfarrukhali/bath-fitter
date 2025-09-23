import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  const { theme } = useTheme();

  const logoSrc =
    theme === "dark"
      ? "/home-care-logo-black.jpg"
      : "/home-care-logo-white.jpg";

  return (
    <nav className=" shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={"/"} className="flex items-center">
            <div className="flex items-center space-x-2">
              <Image
                src={logoSrc}
                alt="Home Care"
                width={100}
                height={100}
                className="mr-3"
              />
              <span className="text-2xl font-bold">Home Care</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <div className="ml-auto">
              <ThemeSwitcher />
            </div>
            {/* Get Quote Button */}
            <Link
              href={"/quote"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
