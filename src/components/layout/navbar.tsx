import { Link } from "wouter";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <i className="fas fa-brain text-primary text-2xl mr-2"></i>
              <span className="font-bold text-xl text-gray-800">ExamGenius</span>
            </Link>
          </div>
          <div className="flex items-center">
            <button className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none">
              <i className="fas fa-question-circle"></i>
            </button>
            <button className="ml-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none">
              <i className="fas fa-user-circle text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
