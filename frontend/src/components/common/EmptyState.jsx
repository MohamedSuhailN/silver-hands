import React from 'react';

export const EmptyState = ({ icon = '🔍', title, description, action }) => (
  <div className="card-surface p-12 text-center max-w-md mx-auto my-8">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="font-heading text-xl font-bold text-warmgray-900 mb-2">{title}</h3>
    <p className="text-sm text-warmgray-600 mb-6">{description}</p>
    {action}
  </div>
);
