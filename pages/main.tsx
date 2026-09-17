import React from 'react';
import {createRoot} from 'react-dom/client';
import MuskanGift from './gift';
import '../app/globals.css';
// This dedicated entry point never loads analytics, AI, or the public dashboard.
createRoot(document.getElementById('root')!).render(<MuskanGift/>);
