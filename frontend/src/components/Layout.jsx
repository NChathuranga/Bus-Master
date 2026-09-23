import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar />
      
      {/* Main Right Side Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navigation */}
        <Navbar />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Top background blur effect for smooth scrolling under navbar */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#F8FAFC] to-transparent z-10 pointer-events-none"></div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-full transition-all duration-300">
            {children}
          </div>
          
        </main>
        
      </div>
      
    </div>
  );
};

export default Layout;