import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  LOTTO_GAMES,
  LOTTO_GAME_LABELS,
  isLottoGame,
  type LottoGame,
  type LottoDrawResult,
} from '../api/types';
import BackendWakeupNotice from './BackendWakeupNotice';
import { useLottoResults } from '../hooks/useLottoResults';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(1);
  return { from: formatLocalDate(from), to: formatLocalDate(to) };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatJackpot(draw: LottoDrawResult): string {
  return (
    draw.jackpotFormatted ??
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(draw.jackpot)
  );
}

export default function ResultsPage() {
  const defaultRange = getDefaultRange();
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [game, setGame] = useState<LottoGame>('6/58');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const { results, loading, error, hasSearched, loadResults } = useLottoResults();

  useEffect(() => {
    void loadResults(defaultRange.from, defaultRange.to, '6/58');
  }, [defaultRange.from, defaultRange.to, loadResults]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlertDismissed(false);

    if (fromDate > toDate) {
      setValidationError('From Date must be on or before To Date.');
      return;
    }

    setValidationError(null);
    void loadResults(fromDate, toDate, game);
  }

  const alertMessage =
    validationError ??
    error ??
    (hasSearched && !loading && results.length === 0
      ? 'No draw results were found for this game and date range.'
      : null);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header text-white">
        <Container className="py-4 py-md-5">
          <p className="text-uppercase small fw-semibold dashboard-kicker mb-2">
            Lotto Results Hub PH
          </p>
          <h1 className="display-6 fw-semibold mb-2">Lotto Results Log</h1>
          <p className="lead mb-0 dashboard-lead">
            Browse winning combinations and jackpot details from recent draws.
          </p>
        </Container>
      </header>

      <Container className="pb-5 dashboard-body">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Form onSubmit={handleFilter}>
              <Row className="align-items-end g-3">
                <Col sm={6} lg={3}>
                  <Form.Group controlId="results-from-date">
                    <Form.Label className="fw-semibold">From Date</Form.Label>
                    <Form.Control
                      type="date"
                      aria-label="From Date"
                      value={fromDate}
                      max={toDate}
                      onChange={(event) => setFromDate(event.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} lg={3}>
                  <Form.Group controlId="results-to-date">
                    <Form.Label className="fw-semibold">To Date</Form.Label>
                    <Form.Control
                      type="date"
                      aria-label="To Date"
                      value={toDate}
                      min={fromDate}
                      onChange={(event) => setToDate(event.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} lg={3}>
                  <Form.Group controlId="results-game">
                    <Form.Label className="fw-semibold">Lotto game</Form.Label>
                    <Form.Select
                      aria-label="Lotto game"
                      value={game}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (isLottoGame(next)) {
                          setGame(next);
                        }
                      }}
                    >
                      {LOTTO_GAMES.map((option) => (
                        <option key={option} value={option}>
                          {LOTTO_GAME_LABELS[option]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm={6} lg={3}>
                  <Button
                    type="submit"
                    variant="warning"
                    className="w-100 smart-pick-button"
                    disabled={loading}
                  >
                    {loading ? "Filtering…" : "Filter"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {alertMessage && !alertDismissed ? (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setAlertDismissed(true)}
            data-testid="results-alert"
          >
            {alertMessage}
          </Alert>
        ) : null}

        <section aria-labelledby="results-heading">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h2 id="results-heading" className="h4 mb-0">
              Recent Draw Results
            </h2>
            <span className="text-secondary">
              {results.length} {results.length === 1 ? "draw" : "draws"}
            </span>
          </div>

          <div className="position-relative">
            {results.length > 0 ? (
              <Row className="g-3" data-testid="draw-results">
                {results.map((draw) => (
                  <Col md={6} xl={4} key={`${draw.gameName}-${draw.drawDate}`}>
                    <DrawCard draw={draw} />
                  </Col>
                ))}
              </Row>
            ) : null}

            {loading ? (
              <div
                className="results-loading-overlay"
                role="status"
                data-testid="results-loading"
              >
                <Spinner animation="border" variant="primary">
                  <span className="visually-hidden">Loading draw results</span>
                </Spinner>
                <div>
                  <div>Loading draw results…</div>
                  <BackendWakeupNotice testId="results-backend-wakeup" />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </Container>
    </div>
  );
}

function DrawCard({ draw }: { draw: LottoDrawResult }) {
  return (
    <Card className="h-100 border-0 shadow-sm result-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Subtitle className="text-secondary mb-1">
              {draw.gameName}
            </Card.Subtitle>
            <Card.Title as="h3" className="h5 mb-0">
              {formatDate(draw.drawDate)}
            </Card.Title>
          </div>
        </div>

        <div className="result-prize mb-3">
          <span className="d-block text-secondary small">Jackpot Prize</span>
          <strong>{formatJackpot(draw)}</strong>
        </div>

        <div
          className="d-flex flex-wrap gap-2 mb-3"
          role="group"
          aria-label="Winning numbers"
        >
          {draw.numbers.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className={`lotto-ball lotto-ball-green result-ball`}
            >
              {String(number).padStart(2, '0')}
            </span>
          ))}
        </div>

        <div className="border-top pt-3">
          <span className="text-secondary small">Total winners</span>
          <strong className="d-block">
            {draw.winners === undefined
              ? 'Not provided by the API'
              : new Intl.NumberFormat('en-PH').format(draw.winners)}
          </strong>
        </div>
      </Card.Body>
    </Card>
  );
}
