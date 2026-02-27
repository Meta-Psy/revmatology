import { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';

export const useHeroImage = (pageKey) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    contentAPI.getHeroImages().then(res => {
      const hero = (Array.isArray(res.data) ? res.data : []).find(
        h => h.page_key === pageKey && h.is_active
      );
      if (hero?.image_url) setImageUrl(hero.image_url);
    }).catch(() => {});
  }, [pageKey]);

  return imageUrl;
};
