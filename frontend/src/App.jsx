import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import ScrapeJobsPage from './ScrapeJobsPage';
import TailorResumePage from './TailorResumePage';
import EmailHRPage from './EmailHRPage';
import AIInterviewPage from './AIInterviewPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scrape-jobs" element={<ScrapeJobsPage />} />
                <Route path="/tailor-resume" element={<TailorResumePage />} />
                <Route path="/email-hr" element={<EmailHRPage />} />
                <Route path="/ai-interview" element={<AIInterviewPage />} />
                {/* Redirect unknown routes to landing page */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
