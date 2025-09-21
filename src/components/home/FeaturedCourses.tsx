"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Course } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import CourseCard from "@/components/ui/CourseCard";
import courseService from "@/services/courseService";


export default function FeaturedCourses() {
  const { t } = useLanguage();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  // Fetch featured courses and auto-slide
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const tryTypes = ["Featured"];
        let list: any[] | null = null;
        for (const t of tryTypes) {
          const res = await courseService.getCoursesByType(t, { limit: 12, sortBy: "createdAt", sortOrder: "DESC" });
          const arr = (res?.data as any)?.courses || (Array.isArray(res?.data) ? (res?.data as any) : []);
          if (res?.success && Array.isArray(arr)) { list = arr; break; }
        }
        if (!list) {
          const res2 = await courseService.getFeaturedCourses({ limit: 12 });
          list = Array.isArray(res2?.data) ? (res2.data as any[]) : [];
        }
        if (!ignore && Array.isArray(list)) {
          const mapped: Course[] = list.map((c: any) => {
            const instructorName = c?.instructor?.name || [c?.instructor?.firstName, c?.instructor?.lastName].filter(Boolean).join(" ") || c?.instructorId || "Instructor";
            const categoryName = c?.category?.name || c?.category || "General";
            const created = c?.createdAt ? new Date(c.createdAt) : new Date();
            const durationStr = typeof c?.totalDuration === "string" && c?.totalDuration
              ? c.totalDuration
              : typeof c?.duration === "number"
                ? `${c.duration} min`
                : String(c?.duration || "");
            return {
              id: String(c.id),
              title: String(c.title || ""),
              description: String(c.description || ""),
              instructor: String(instructorName),
              instructorId: String(c.instructorId || c?.instructor?.id || ""),
              price: Number(c.price ?? 0),
              duration: durationStr,
              thumbnail: c.thumbnail || "/placeholder-course.jpg",
              category: String(categoryName),
              enrolledStudents: Number(c.enrollmentCount ?? 0),
              rating: Number(c.rating ?? 0),
              createdAt: created,
            };
          });
          setCourses(mapped);
        }
      } catch {
        if (!ignore) setCourses([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const maxIndex = Math.max(0, courses.length - 1);
          return prevIndex >= maxIndex ? 0 : prevIndex + 1;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, courses.length]);

  // Update slider position
  useEffect(() => {
    if (sliderRef.current) {
      const track = sliderRef.current;
      const scroller = track.parentElement as HTMLElement;
      const firstCard = track.querySelector('[data-card]') as HTMLElement;
      if (firstCard && scroller) {
        const slideWidth = firstCard.offsetWidth;
        const computedStyle = window.getComputedStyle(track);
        const gap = parseInt(computedStyle.gap) || 16;
        const scrollPosition = currentIndex * (slideWidth + gap);
        scroller.scrollTo({ left: scrollPosition, behavior: "smooth" });
      }
    }
  }, [currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, courses.length - 1);
      return prevIndex >= maxIndex ? 0 : prevIndex + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      return prevIndex <= 0 ? Math.max(0, courses.length - 1) : prevIndex - 1;
    });
  };

  return (
    <section className="pt-16 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-50">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t("featuredCourses.title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("featuredCourses.subtitle")}
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 transition-colors duration-200 hidden md:flex items-center justify-center nav-arrow-left"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 transition-colors duration-200 hidden md:flex items-center justify-center nav-arrow-right"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Slider */}
          <div className="overflow-x-auto overflow-y-visible scrollbar-hide pl-6 pr-4 sm:pl-8 sm:pr-8 -my-4 py-4">
            <div
              ref={sliderRef}
              className="flex gap-0 sm:gap-6 lg:gap-8 overflow-visible slider-container snap-x-mandatory"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  data-card
                  className={`${idx === 0 ? "ml-4 sm:ml-8" : ""} transition-all duration-300`}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {courses.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* View All Courses */}
        <div className="text-center mt-12">
          <Link href="/courses">
            <Button
              variant="outline"
              size="lg"
              className="btn-outline-primary btn-animate"
            >
              View All Courses
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
