import { useState } from "react";
import { Button, Container, Nav } from "react-bootstrap";
import Dashboard from "./components/Dashboard";
import ResultsPage from "./components/ResultsPage";
import "./App.css";

function App() {
  const [activeView, setActiveView] = useState<"results" | "analytics">(
    "results",
  );

  return (
    <>
      <Container className="pt-3">
        <Nav
          variant="tabs"
          role="tablist"
          aria-label="Lotto views"
          className="app-navigation"
        >
          <Nav.Link
            as="button"
            type="button"
            role="tab"
            id="results-tab"
            aria-controls="lotto-view-panel"
            aria-selected={activeView === "results"}
            active={activeView === "results"}
            onClick={() => setActiveView("results")}
          >
            Recent Draw Results
          </Nav.Link>
          <Nav.Link
            as="button"
            type="button"
            role="tab"
            id="analytics-tab"
            aria-controls="lotto-view-panel"
            aria-selected={activeView === "analytics"}
            active={activeView === "analytics"}
            onClick={() => setActiveView("analytics")}
          >
            Analytics &amp; Smart Picks
          </Nav.Link>
        </Nav>
      </Container>
      <div
        id="lotto-view-panel"
        role="tabpanel"
        aria-labelledby={
          activeView === "results" ? "esults-tab" : "results-tab"
        }
      >
        {activeView === "results" ? <ResultsPage /> : <Dashboard />}
      </div>
      <footer className="app-footer">
        <Container className="d-flex flex-column align-items-center gap-2 py-4">
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
            <span className="text-secondary">Enjoying the dashboard?</span>
            <Button
              as="a"
              href="https://buymeacoffee.com/mrenyrab"
              target="_blank"
              rel="noopener noreferrer"
              className="buy-coffee-button"
              data-testid="buy-coffee-button"
            >
              Buy me a coffee
            </Button>
          </div>
          <p className="app-disclaimer mb-0" data-testid="app-disclaimer">
            This website is an independent statistical dashboard and is not
            affiliated with, endorsed by, or connected to the Philippine
            Charity Sweepstakes Office (PCSO).
          </p>
        </Container>
      </footer>
    </>
  );
}

export default App;
