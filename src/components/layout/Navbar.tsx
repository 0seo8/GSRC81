'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, MapPin } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">
              GSRC81 Maps
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/map">
              <Button variant="ghost">지도</Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost">코스 목록</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                관리자
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Link href="/map">
                <Button variant="ghost" className="w-full justify-start">
                  지도
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="ghost" className="w-full justify-start">
                  코스 목록
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" className="w-full justify-start">
                  관리자
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}