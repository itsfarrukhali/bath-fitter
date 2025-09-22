import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={"/"} className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">BF</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Bath Fitter
              </span>
            </div>
          </Link>

          {/* Get Quote Button */}
          <Link
            href={"/quote"}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Get a Quote
          </Link>
        </div>
      </div>
    </nav>
  );
}
