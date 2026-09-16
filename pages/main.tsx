import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import {AnalyticsSettings} from './usage';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('view')==='analytics'?<AnalyticsSettings/>:<Home/>);
