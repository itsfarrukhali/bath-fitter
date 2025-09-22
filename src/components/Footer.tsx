export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">BF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Bath Fitter
              </span>
            </div>
            <p className="text-gray-600 max-w-md">
              Transform your bathroom with our premium bath and shower
              solutions. Design your perfect space with our interactive
              configurator.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Bath Remodeling</li>
              <li>Shower Installation</li>
              <li>Accessibility Solutions</li>
              <li>Maintenance</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Contact Us</li>
              <li>FAQ</li>
              <li>Warranty</li>
              <li>Find a Dealer</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6">
          <p className="text-center text-gray-500">
            &copy; {new Date().getFullYear()} Bath Fitter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
