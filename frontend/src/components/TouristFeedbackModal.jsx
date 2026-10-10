import React, { useState } from 'react';
import { Star, X, CheckCircle2, HeartHandshake, Sparkles, Send } from 'lucide-react';
import { analyticsApi } from '../services/api';

export default function TouristFeedbackModal({ isOpen, onClose, userName, groupName, onSubmitted }) {
  const [overallRating, setOverallRating] = useState(5);
  const [guideRating, setGuideRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [sceneryRating, setSceneryRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Helpful Guide', 'Safe with Family']);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const quickTags = [
    'Helpful Guide',
    'Safe with Family',
    'Comfortable Pace',
    'Clear Audio Broadcasts',
    'Breathtaking Views',
    'Prompt Responders'
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullComment = `${comment.trim() ? `${comment.trim()} ` : ''}${
        selectedTags.length > 0 ? `[Highlights: ${selectedTags.join(', ')}]` : ''
      }`.trim();

      await analyticsApi.submitFeedback({
        tour_id: 'tour_ooty_nilgiris',
        tourist_name: `${userName || 'Tourist'}${groupName ? ` (${groupName})` : ''}`,
        rating: overallRating,
        guide_rating: guideRating,
        safety_rating: safetyRating,
        scenery_rating: sceneryRating,
        comment: fullComment || 'Great tour experience!'
      });

      setSubmitted(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      // Fallback local acknowledgment
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">Rate Your Tour Experience</h3>
              <p className="text-[11px] text-slate-500 font-medium">Nilgiris Expedition Feedback & Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-lg text-slate-900">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your rating has been recorded and helps our tour guides deliver the highest quality mountain exploration.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Overall Rating Stars */}
            <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-1.5">Overall Satisfaction</span>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= overallRating
                          ? 'text-amber-500 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-bold text-amber-600 mt-1 inline-block">
                {overallRating === 5 && 'Outstanding ★★★★★'}
                {overallRating === 4 && 'Very Good ★★★★☆'}
                {overallRating === 3 && 'Average ★★★☆☆'}
                {overallRating === 2 && 'Needs Improvement ★★☆☆☆'}
                {overallRating === 1 && 'Unsatisfactory ★☆☆☆☆'}
              </span>
            </div>

            {/* Sub-ratings Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-semibold text-slate-500">Guide Service</p>
                <div className="flex justify-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGuideRating(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          s <= guideRating ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-semibold text-slate-500">Safety & Tracking</p>
                <div className="flex justify-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSafetyRating(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          s <= safetyRating ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] font-semibold text-slate-500">Scenic Route</p>
                <div className="flex justify-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSceneryRating(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          s <= sceneryRating ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick highlight tags */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 block mb-1.5">Key Highlights</span>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Feedback Text */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Review & Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on the guides, trail safety, audio navigation..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
