import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Landmark, ExternalLink, Filter } from 'lucide-react';
import { GovScheme } from '@/types';
import SafeImage from '@/components/SafeImage';
import { moduleImages } from '@/lib/imageAssets';

const schemes: GovScheme[] = [
  {
    id: '1',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    description: 'Direct income support of ₹6,000 per year to all landholding farmer families.',
    eligibility: 'All landholding farmer families (subject to exclusion criteria).',
    benefits: '₹6,000 per year in three equal installments of ₹2,000.',
    applyLink: 'https://pmkisan.gov.in/',
    farmerType: 'Small & Marginal'
  },
  {
    id: '2',
    name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
    description: 'Crop insurance scheme to provide financial support to farmers suffering crop loss/damage.',
    eligibility: 'All farmers including sharecroppers and tenant farmers.',
    benefits: 'Low premium rates (2% for Kharif, 1.5% for Rabi). Full sum insured for losses.',
    applyLink: 'https://pmfby.gov.in/',
    farmerType: 'All'
  },
  {
    id: '3',
    name: 'Soil Health Card Scheme',
    description: 'Provides information to farmers on nutrient status of their soil along with recommendations on appropriate dosage of nutrients.',
    eligibility: 'All farmers in India.',
    benefits: 'Improved soil health, reduced cost of cultivation, increased yield.',
    applyLink: 'https://soilhealth.dac.gov.in/',
    farmerType: 'All'
  },
  {
    id: '4',
    name: 'Kisan Credit Card (KCC)',
    description: 'Provides farmers with timely access to credit for cultivation and other needs.',
    eligibility: 'All farmers, individuals/joint borrowers, tenant farmers, oral lessees & sharecroppers.',
    benefits: 'Flexible credit limit, low interest rates, insurance coverage.',
    applyLink: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1603541',
    farmerType: 'All'
  },
  {
    id: '5',
    name: 'PM-KMY (Pradhan Mantri Kisan Maan-Dhan Yojana)',
    description: 'Pension scheme for small and marginal farmers to provide social security.',
    eligibility: 'Small and marginal farmers aged between 18 to 40 years.',
    benefits: 'Monthly pension of ₹3,000 after attaining the age of 60 years.',
    applyLink: 'https://maandhan.in/',
    farmerType: 'Small & Marginal'
  }
];

export default function GovSchemes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [farmerTypeFilter, setFarmerTypeFilter] = useState('All');

  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = farmerTypeFilter === 'All' || s.farmerType === farmerTypeFilter || s.farmerType === 'All';
    return matchesSearch && matchesType;
  });

  return (
    <Layout title="Government Schemes">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-[24px] bg-emerald-900 p-6 text-white shadow-lg">
          <SafeImage src={moduleImages.schemes} alt="Farmer reviewing agricultural scheme support" className="absolute inset-0 h-full w-full opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/85 to-emerald-900/20" />
          <div className="relative max-w-2xl space-y-2">
            <h2 className="text-2xl font-black">Government support for Indian farmers</h2>
            <p className="text-sm leading-6 text-emerald-50">Browse verified schemes for income support, crop insurance, soil health, credit, and farmer pension benefits.</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8C8D]" />
            <Input 
              placeholder="Search schemes..." 
              className="pl-10 rounded-xl border-emerald-100 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select onValueChange={setFarmerTypeFilter} defaultValue="All">
              <SelectTrigger className="bg-white rounded-xl border-emerald-100">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  <SelectValue placeholder="Farmer Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Farmer Types</SelectItem>
                <SelectItem value="Small & Marginal">Small & Marginal</SelectItem>
                <SelectItem value="Large">Large Farmers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schemes List */}
        <div className="space-y-6">
          {filteredSchemes.map(scheme => (
            <Card key={scheme.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-[24px] overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <Landmark className="h-6 w-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl text-[#2C3E50]">{scheme.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none shrink-0">
                    {scheme.farmerType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#7F8C8D] leading-relaxed">{scheme.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F8F9F3] p-4 rounded-2xl border border-[#EAECE6]">
                    <h4 className="font-bold text-xs text-[#2D5A27] uppercase mb-2">Eligibility</h4>
                    <p className="text-xs text-[#2C3E50]">{scheme.eligibility}</p>
                  </div>
                  <div className="bg-[#F8F9F3] p-4 rounded-2xl border border-[#EAECE6]">
                    <h4 className="font-bold text-xs text-[#2D5A27] uppercase mb-2">Benefits</h4>
                    <p className="text-xs text-[#2C3E50]">{scheme.benefits}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full md:w-auto border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-xl gap-2"
                    onClick={() => window.open(scheme.applyLink, '_blank')}
                  >
                    Apply Now <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSchemes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#7F8C8D]">No schemes found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
