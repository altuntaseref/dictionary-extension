import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const featureMap = {
  free: ['Basic access', 'Limited word lists', 'Community support'],
  pro: ['All "Free" features', 'Unlimited lists', 'Ad-free experience', 'Advanced search'],
  pro_plus: ['All "Pro" features', 'Offline access', 'Early access to new languages', 'Priority support'],
};

const planLabels = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
};

export default function Upgrade() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, userPlanRes] = await Promise.all([
        api.getPlans(),
        api.getUserPlan(),
      ]);
      setPlans(plansRes.plans || []);
      setCurrentPlan(userPlanRes.plan);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planName) => {
    if (currentPlan?.name === planName) {
      return;
    }
    alert('Upgrade flow coming soon!');
  };

  const renderPrice = (plan) => {
    if (!plan.price || plan.price === 0) {
      return '$0';
    }
    return `$${Number(plan.price).toFixed(2)}`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-drab-dark-brown mb-3 tracking-[-0.04em]">Upgrade to Pro</h1>
          <p className="text-umber text-lg">Unlock advanced features and support our work.</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-umber">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlan?.name === plan.name;
              const isMostPopular = plan.name === 'pro';
              const title = plan.display_name || planLabels[plan.name] || plan.name;
              const features = featureMap[plan.name] || [];

              return (
                <div
                  key={plan.id}
                  className={`relative card p-8 flex flex-col gap-6 border-2 ${
                    isCurrent ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  {isMostPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-drab-dark-brown mb-2">{title}</h3>
                    <div className="text-4xl font-black text-drab-dark-brown">
                      {renderPrice(plan)}
                      <span className="text-base font-medium text-umber"> /month</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    disabled={isCurrent}
                    className={`h-11 rounded-lg text-sm font-semibold tracking-wide transition-colors ${
                      isCurrent
                        ? 'bg-sage/30 text-umber cursor-default'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {isCurrent ? 'Your Current Plan' : 'Select Plan'}
                  </button>
                  <ul className="space-y-2 text-sm text-umber">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-primary-600 mt-0.5">check</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.can_use_groups && !features.includes('Groups feature') && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-primary-600 mt-0.5">check</span>
                        <span>Groups feature</span>
                      </li>
                    )}
                    {plan.can_access_exercises && !features.includes('Exercises access') && (
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-primary-600 mt-0.5">check</span>
                        <span>Exercises access</span>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-drab-dark-brown mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FAQItem
              question="How does billing work?"
              answer="Your subscription will automatically renew each month. You will be billed on the same day you originally subscribed. You can manage your billing details from your account settings."
            />
            <FAQItem
              question="Can I cancel my subscription anytime?"
              answer="Yes, you can cancel your subscription at any time from your account settings. Your plan will remain active until the end of the billing cycle."
            />
            <FAQItem
              question="What happens to my data if I cancel?"
              answer="Your vocabulary data will remain intact. You will retain access to the Free plan features and can upgrade again at any time."
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-sage/30 rounded-lg">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-drab-dark-brown"
      >
        {question}
        <span className="material-symbols-outlined text-base text-umber">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && <p className="px-4 pb-4 text-sm text-umber leading-relaxed">{answer}</p>}
    </div>
  );
}


