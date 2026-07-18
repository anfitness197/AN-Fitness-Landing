"use client";

import React from "react";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const ROW1_REVIEWS: Testimonial[] = [
  {
    name: "Pritam Sharma",
    role: "Member since 2024",
    content: "Clean gym, helpful trainers, and top-tier equipment. Highly recommend this place!",
    rating: 5,
  },
  {
    name: "Ananya Iyer",
    role: "IT Professional",
    content: "The flexible hours are very helpful, very motivating crowd, and the setup is always neat and clean.",
    rating: 5,
  },
  {
    name: "Vikram Malhotra",
    role: "Powerlifting Enthusiast",
    content: "Excellent lifting platforms, clean environment, and trainers who actually guide you properly.",
    rating: 5,
  },
];

const ROW2_REVIEWS: Testimonial[] = [
  {
    name: "Rahul Verma",
    role: "Student Member",
    content: "Affordable pricing plans, helpful coaches, and clean change rooms. Absolute value for money.",
    rating: 5,
  },
  {
    name: "Pooja Patel",
    role: "Fitness Model",
    content: "Super friendly crowd, clean training floor, and very helpful owners. Safe space for everyone.",
    rating: 5,
  },
  {
    name: "Amit Deshmukh",
    role: "Executive Member",
    content: "Outstanding cardio setup, clean weights section, and certified coaches. A complete 10/10.",
    rating: 5,
  },
];

export const ReviewsMarquee: React.FC = () => {
  const duplicate = (arr: Testimonial[]) => [...arr, ...arr, ...arr, ...arr];

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 overflow-hidden py-6 sm:py-10 relative">
      <div className="absolute inset-y-0 left-0 w-12 sm:w-16 md:w-48 bg-gradient-to-r from-zinc-950 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 sm:w-16 md:w-48 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />

      <div className="relative flex w-full overflow-hidden pause-hover select-none">
        <div className="flex gap-4 sm:gap-6 shrink-0 min-w-full animate-marquee">
          {duplicate(ROW1_REVIEWS).map((rev, idx) => (
            <ReviewCard key={`r1-${idx}`} review={rev} />
          ))}
        </div>
      </div>

      <div className="relative flex w-full overflow-hidden pause-hover select-none">
        <div className="flex gap-4 sm:gap-6 shrink-0 min-w-full animate-marquee-reverse">
          {duplicate(ROW2_REVIEWS).map((rev, idx) => (
            <ReviewCard key={`r2-${idx}`} review={rev} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ReviewCardProps {
  review: Testimonial;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="w-[240px] xs:w-[260px] sm:w-[360px] shrink-0 bg-zinc-900/10 bg-gradient-to-br from-brandRed/[0.03] to-transparent border border-zinc-900/60 hover:border-zinc-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col justify-center transition-all duration-300 backdrop-blur-sm">
      <div className="flex gap-0.5 sm:gap-1 text-brandRed mb-2 sm:mb-3">
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} size={10} fill="currentColor" className="text-brandRed" />
        ))}
      </div>
      <p className="text-zinc-300 text-[10px] sm:text-xs md:text-sm font-light italic leading-relaxed">
        &ldquo;{review.content}&rdquo;
      </p>
    </div>
  );
};
