import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, User, Bot, CheckCircle2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expert, ExpertQA } from '@/types';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

const experts: Expert[] = [
  { id: '1', name: 'Dr. Ramesh Kumar', specialization: 'Soil Science & Fertilizers', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300' },
  { id: '2', name: 'Dr. Anita Sharma', specialization: 'Pest Management', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300' },
  { id: '3', name: 'Prof. S. Venkatesh', specialization: 'Horticulture', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300' }
];

const initialQA: ExpertQA[] = [
  {
    id: '1',
    question: 'What is the best time to apply Urea to Wheat?',
    answer: 'The best time is during the first irrigation (CRI stage) and again at the tillering stage for maximum nitrogen uptake.',
    expertId: '1',
    createdAt: Date.now() - 86400000
  },
  {
    id: '2',
    question: 'How to control fruit borer in Tomatoes organically?',
    answer: 'You can use Neem oil sprays and install pheromone traps. Intercropping with Marigold also helps repel the moths.',
    expertId: '2',
    createdAt: Date.now() - 172800000
  }
];

export default function ExpertAdvice() {
  const [qaList, setQaList] = useState<ExpertQA[]>(initialQA);
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    
    // Simulate expert answer after 2 seconds
    const newQA: ExpertQA = {
      id: Date.now().toString(),
      question: question,
      createdAt: Date.now()
    };

    setQaList([newQA, ...qaList]);
    setQuestion('');
    toast.success('Question submitted! An expert will answer shortly.');

    setTimeout(() => {
      setQaList(prev => prev.map(item => 
        item.id === newQA.id 
          ? { ...item, answer: 'Based on your query, we recommend checking the soil moisture first. Our expert will provide a detailed response soon.', expertId: '1' }
          : item
      ));
      setIsSubmitting(false);
    }, 3000);
  };

  return (
    <Layout title="Expert Advice">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Q&A Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[24px] bg-white overflow-hidden">
            <CardHeader className="relative bg-emerald-600 text-white p-6 overflow-hidden">
              <SafeImage src={moduleImages.expertAdvice} alt="Agriculture consultation" className="absolute inset-0 h-full w-full opacity-25" />
              <div className="absolute inset-0 bg-emerald-800/70" />
              <div className="relative">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Ask an Expert
              </CardTitle>
              <p className="text-emerald-100 text-sm">Get verified answers from agricultural scientists.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input 
                  placeholder="Ask your farming question..." 
                  className="rounded-xl border-emerald-100 h-12"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6" disabled={isSubmitting}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#2C3E50] px-2">Recent Q&A</h3>
            <AnimatePresence>
              {qaList.map((qa) => (
                <motion.div
                  key={qa.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <Card className="border-none shadow-sm rounded-[24px] bg-white p-6">
                    <div className="flex gap-4">
                      <div className="bg-emerald-50 h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="space-y-4 flex-1">
                        <div>
                          <p className="font-bold text-[#2C3E50] mb-1">{qa.question}</p>
                          <span className="text-[10px] text-[#7F8C8D] uppercase tracking-wider">Asked by Farmer</span>
                        </div>

                        {qa.answer ? (
                          <div className="bg-[#F8F9F3] p-4 rounded-2xl border border-[#EAECE6] relative">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={experts.find(e => e.id === qa.expertId)?.image} />
                                <AvatarFallback>E</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-bold text-[#2D5A27]">
                                {experts.find(e => e.id === qa.expertId)?.name}
                                <CheckCircle2 className="h-3 w-3 inline ml-1 text-blue-500" />
                              </span>
                            </div>
                            <p className="text-sm text-[#2C3E50] leading-relaxed">{qa.answer}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium bg-amber-50 w-fit px-3 py-1 rounded-full">
                            <Bot className="h-3 w-3 animate-pulse" />
                            Expert is typing...
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Expert Profiles */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[24px] bg-white p-6">
            <CardTitle className="text-lg text-[#2D5A27] mb-6">Our Panel of Experts</CardTitle>
            <div className="space-y-6">
              {experts.map(expert => (
                <div key={expert.id} className="flex items-center gap-4 group cursor-pointer">
                  <Avatar className="h-14 w-14 border-2 border-emerald-50 transition-transform group-hover:scale-110">
                    <AvatarImage src={expert.image} />
                    <AvatarFallback>{expert.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-[#2C3E50] text-sm group-hover:text-emerald-700 transition-colors">{expert.name}</h4>
                    <p className="text-[10px] text-[#7F8C8D] uppercase tracking-wider">{expert.specialization}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-8 border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-xl">
              View All Experts
            </Button>
          </Card>

          <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100">
            <h4 className="text-blue-800 font-bold mb-2">Expert Tip 💡</h4>
            <p className="text-blue-700 text-xs leading-relaxed">
              Always rotate your crops every season. Planting the same crop repeatedly depletes specific soil nutrients and attracts pests.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
