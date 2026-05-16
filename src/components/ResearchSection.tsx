import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface ResearchSectionProps {
  onArticleClick: (article: any) => void;
}

const ResearchSection: React.FC<ResearchSectionProps> = ({ onArticleClick }) => {
  const articles = [
    {
      title: "Sustainable Yield Optimization via Deep Learning",
      category: "RESEARCH / 2026",
      image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=1200",
      className: "lg:col-span-2 lg:row-span-2 min-h-[400px]",
      content: `
## Executive Summary
Recent breakthroughs in EfficientNet and Vision Transformer architectures have enabled real-time plant stress detection with unprecedented accuracy. This research explores how localized deep learning models can optimize irrigation cycles by predicting wilt points 48 hours before visible signs appear.

## Methodology & Dataset
Using a multi-spectral dataset of 1.2M crop images, we trained a custom encoder-decoder model to map pixel-level chlorosis patterns to specific nutrient deficiencies (Nitrogen, Phosphorus, Potassium).

## Key Findings
- **Precision Fertilization**: 14% reduction in nitrogen fertilizer waste.
- **Yield Improvements**: 22% increase in average yield for Maize crops.
- **Latency Optimization**: Real-time inference latency of <200ms on edge devices.
      `
    },
    {
      title: "Impact of Climate Shifts on Crop Resilience",
      category: "CASE STUDY",
      image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-1 lg:row-span-2 min-h-[400px]",
      content: `
## Overview of Climate Volatility
As global temperatures shift, traditional planting calendars are becoming increasingly unreliable. This case study analyzes how dynamic AI forecasting helps farmers adapt to erratic monsoon patterns.

## Adaptation Strategies
Farmers using FarmShield AI's predictive atmospheric modeling saw a **30% decrease in crop loss** during the unseasonal rains of 2025.

## Conclusion
Data-driven decision making is the only way to safeguard the global food supply chain against the unpredictability of a warming planet.
      `
    },
    {
      title: "Bio-Digital Twins in Modern Agriculture",
      category: "INNOVATION",
      image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-1 lg:row-span-1 min-h-[200px]",
      content: `
## The Digital Frontier
A Bio-Digital Twin is a virtual replica of a physical crop plant, updated in real-time with sensor data.

## Practical Application
By simulating a "what-if" scenario in the digital twin, a farmer can see the impact of a specific fertilizer dose or irrigation adjustment.
      `
    },
    {
      title: "Hydroponic Nutrient Sensing",
      category: "AUTOMATION",
      image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-1 lg:row-span-1 min-h-[200px]",
      content: `
## Precise Nutrition
In hydroponic systems, the balance of nutrients in the water is critical. This research introduces a low-cost optical sensor for real-time NPK monitoring.

## Closed-Loop Systems
By connecting these sensors to an AI controller, we can create a fully autonomous system that adjusts concentrations in real-time.
      `
    },
    {
      title: "Edge-AI Deployment in Low-Connectivity Zones",
      category: "TECHNOLOGY",
      image: "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-2 lg:row-span-1 min-h-[200px]",
      content: `
## The Connectivity Challenge
One of the biggest hurdles in rural agriculture is the lack of reliable high-speed internet. This research focuses on optimizing neural networks to run locally on low-power devices.

## Field Results
In testing across high-altitude tea plantations with zero signal, the Edge-AI system successfully identified 92% of fungal infections.
      `
    },
    {
      title: "Regenerative Agriculture: A Data-First Approach",
      category: "ECOLOGY",
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-1 lg:row-span-1 min-h-[200px]",
      content: `
## Restoring the Soil
Regenerative agriculture is about soil health and carbon sequestration. Our AI models now track soil organic matter (SOM) over multi-year cycles.

## Carbon Credits
We are helping small-scale farmers access global carbon markets, creating a new revenue stream for sustainable practices.
      `
    },
    {
      title: "Next-Gen Pest Management Protocols",
      category: "PROTOCOL",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800",
      className: "lg:col-span-1 lg:row-span-1 min-h-[200px]",
      content: `
## Beyond Chemical Reliance
Traditional pest control relies on broad-spectrum spraying. Our next-gen protocols use AI-driven lifecycle prediction to target pests early.

## Acoustic Detection
Using microphones in the field, our AI can detect the specific sound frequencies of burrowing pests before they emerge.
      `
    }
  ];

  return (
    <div className="w-full relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
        {articles.map((article, i) => (
          <motion.div 
            key={i} 
            layoutId={`article-${i}`}
            onClick={() => onArticleClick(article)}
            className={`${article.className} group cursor-pointer relative overflow-hidden rounded-xl border border-white/5 bg-dark-surface`}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 md:p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-farm-accent rounded-full" />
                  <span className="text-[10px] font-bold tracking-[2px] uppercase text-white/60">
                    {article.category}
                  </span>
                </div>
                <h3 className={`text-white leading-[1.2] tracking-tight group-hover:text-farm-accent transition-colors ${
                  article.className.includes('lg:col-span-2') ? 'text-2xl md:text-3xl max-w-lg' : 'text-lg md:text-xl'
                }`}>
                  {article.title}
                </h3>
              </div>
            </div>

            {/* Hover State Overlay */}
            <div className="absolute inset-0 bg-farm-accent opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />
            <div className="absolute inset-0 ring-1 ring-white/10 ring-inset group-hover:ring-farm-accent/30 transition-all duration-500" />
            
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <BookOpen className="text-white w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ResearchSection;
