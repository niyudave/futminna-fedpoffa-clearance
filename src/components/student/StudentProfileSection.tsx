import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  GraduationCap,
  Building,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StudentProfileSectionProps {
  student: any;
  onProfileUpdated?: () => void;
}

export const StudentProfileSection: React.FC<StudentProfileSectionProps> = ({
  student,
  onProfileUpdated,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [stateOfOrigin, setStateOfOrigin] = useState('');
  const [lga, setLga] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (student) {
      setPhoneNumber(student.user?.phoneNumber || '+234 803 123 4567');
      setAddress(student.address || 'Offa Campus Hostel Block B, Kwara State');
      setStateOfOrigin(student.stateOfOrigin || 'Kwara State');
      setLga(student.lga || 'Offa LGA');
      setNextOfKinName(student.nextOfKinName || 'Mrs. Folashade Adebayo');
      setNextOfKinPhone(student.nextOfKinPhone || '+234 802 987 6543');
      setNextOfKinRelationship(student.nextOfKinRelationship || 'Mother');
    }
  }, [student]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      await axios.put('/api/clearance/student/profile', {
        phoneNumber,
        address,
        stateOfOrigin,
        lga,
        nextOfKinName,
        nextOfKinPhone,
        nextOfKinRelationship,
      });

      setSaveSuccess('Student contact and Next-of-Kin details updated successfully.');
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setSaveError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Grid: Left column (Academic Master Record) & Right Column (Editable Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Academic Master Record (Read-Only Certified Institutional Data) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-purple-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Institutional Academic Records
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Clearance Eligibility
              </span>
              <div className="flex items-center gap-1.5 text-purple-950 font-bold mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cleared for Final Degree Moderation</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Matriculation No.
                </span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">
                  {student?.matricNumber || '2020/1/89420CS'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  JAMB Reg No.
                </span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">
                  {student?.jambRegNumber || '202029482012AF'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Department
                </span>
                <span className="font-semibold text-slate-800 block">
                  {student?.department?.name || 'Department of Computer Science'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Faculty / School
                </span>
                <span className="font-semibold text-slate-800 block">
                  {student?.faculty?.name || 'School of Applied Sciences & Technology (FAST)'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Programme & Moderation
                </span>
                <span className="font-semibold text-slate-800 block">
                  B.Tech (Affiliated with FUTMINNA)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Graduation Session
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {student?.academicSession || '2024/2025'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Cumulative GPA
                </span>
                <span className="font-mono font-bold text-purple-900 block mt-0.5">
                  {student?.cgpa || '4.38'} / 5.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Student Contact & Next-of-Kin Section */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Contact & Next-of-Kin Management
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Required for Graduation Registry
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            {/* Student Personal Contact */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Personal Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Institutional Email (Read Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={student?.user?.email || 'student.test@futminna-fedpoffa.edu.ng'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Residential / Postal Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Hostel address..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State of Origin
                  </label>
                  <input
                    type="text"
                    value={stateOfOrigin}
                    onChange={(e) => setStateOfOrigin(e.target.value)}
                    placeholder="e.g. Kwara State"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Local Government Area (LGA)
                  </label>
                  <input
                    type="text"
                    value={lga}
                    onChange={(e) => setLga(e.target.value)}
                    placeholder="e.g. Offa LGA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Next of Kin */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Next-of-Kin Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={nextOfKinName}
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    placeholder="Next-of-Kin Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    placeholder="+234 802 000 0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={nextOfKinRelationship}
                    onChange={(e) => setNextOfKinRelationship(e.target.value)}
                    placeholder="e.g. Mother / Father / Sibling"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
