import { useState } from 'react';
import {
  Alert,
  Badge,
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
  type NumberFrequency,
} from '../api/types';
import BackendWakeupNotice from './BackendWakeupNotice';
import { useLottoStats } from '../hooks/useLottoStats';

function formatBall(number: number): string {
  return String(number).padStart(2, '0');
}

function NumberBoard({
  title,
  subtitle,
  numbers,
  tone,
  testId,
}: {
  title: string;
  subtitle: string;
  numbers: NumberFrequency[];
  tone: 'hot' | 'cold';
  testId: string;
}) {
  return (
    <Card className="h-100 border-0 shadow-sm number-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Title as="h2" className="h5 mb-1">
              {title}
            </Card.Title>
            <Card.Text className="text-secondary mb-0">{subtitle}</Card.Text>
          </div>
          <Badge bg={tone === 'hot' ? 'danger' : 'primary'} pill>
            {numbers.length}
          </Badge>
        </div>
        {numbers.length === 0 ? (
          <p className="text-secondary mb-0">No numbers in this range yet.</p>
        ) : (
          <div className="d-flex flex-wrap gap-3" data-testid={testId}>
            {numbers.map((entry) => (
              <div key={entry.number} className="number-stat">
                <span className={`lotto-ball lotto-ball-${tone}`}>
                  {formatBall(entry.number)}
                </span>
                <span className="number-count">{entry.count} draws</span>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
  const [game, setGame] = useState<LottoGame>('6/58');
  const {
    frequency,
    frequencyLoading,
    frequencyError,
    picks,
    picksLoading,
    picksError,
    generateSmartPick,
  } = useLottoStats(game);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header text-white">
        <Container className="py-4 py-md-5">
          <p className="text-uppercase small fw-semibold dashboard-kicker mb-2">
            Philippine Charity Sweepstakes Office
          </p>
          <h1 className="display-6 fw-semibold mb-2">Lotto Analytics</h1>
          <p className="lead mb-0 dashboard-lead">
            Hot and cold numbers from past draws, plus Smart Pick combinations
            balanced for sum, parity, and frequency.
          </p>
        </Container>
      </header>

      <Container className="pb-5 dashboard-body">
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-end g-3">
              <Col md={6} lg={4}>
                <Form.Group controlId="lotto-game">
                  <Form.Label className="fw-semibold">Lotto game</Form.Label>
                  <Form.Select
                    aria-label="Lotto game"
                    data-testid="game-select"
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
              <Col md={6} lg={8}>
                <p className="text-secondary mb-0">
                  Showing results for{' '}
                  <strong>{LOTTO_GAME_LABELS[game]}</strong>
                  {frequency ? (
                    <>
                      {' '}
                      across{' '}
                      <strong>{frequency.totalDrawsAnalyzed}</strong> analyzed
                      draws.
                    </>
                  ) : null}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <section aria-labelledby="frequency-heading" className="mb-4">
          <h2 id="frequency-heading" className="h4 mb-3">
            Number frequency
          </h2>

          {frequencyError ? (
            <Alert variant="danger" data-testid="frequency-error">
              {frequencyError}
            </Alert>
          ) : null}

          {frequencyLoading ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="d-flex align-items-center gap-3 py-4">
                <Spinner
                  animation="border"
                  role="status"
                  variant="primary"
                  data-testid="stats-loading"
                >
                  <span className="visually-hidden">Loading statistics</span>
                </Spinner>
                <div>
                  <span>Loading statistics for {LOTTO_GAME_LABELS[game]}…</span>
                  <BackendWakeupNotice testId="frequency-backend-wakeup" />
                </div>
              </Card.Body>
            </Card>
          ) : null}

          {frequency && !frequencyLoading ? (
            <Row className="g-4" data-testid="stats-panel">
              <Col lg={6}>
                <NumberBoard
                  title="Hot numbers"
                  subtitle="Drawn most often in the latest sample."
                  numbers={frequency.hotNumbers}
                  tone="hot"
                  testId="hot-numbers"
                />
              </Col>
              <Col lg={6}>
                <NumberBoard
                  title="Cold numbers"
                  subtitle="Drawn least often in the same sample."
                  numbers={frequency.coldNumbers}
                  tone="cold"
                  testId="cold-numbers"
                />
              </Col>
            </Row>
          ) : null}
        </section>

        <section aria-labelledby="smart-pick-heading">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h2 id="smart-pick-heading" className="h4 mb-1">
                    Smart Pick
                  </h2>
                  <p className="text-secondary mb-0">
                    Generate three combinations that stay inside the usual sum
                    range and mix hot numbers with the rest of the pool.
                  </p>
                </div>
                <Button
                  variant="warning"
                  className="smart-pick-button px-4"
                  disabled={picksLoading}
                  onClick={() => {
                    void generateSmartPick();
                  }}
                >
                  {picksLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        className="me-2"
                      />
                      Generating…
                    </>
                  ) : (
                    'Generate Smart Pick'
                  )}
                </Button>
              </div>

              {picksLoading ? (
                <BackendWakeupNotice testId="picks-backend-wakeup" />
              ) : null}

              {picksError ? (
                <Alert variant="danger" className="mb-0" data-testid="picks-error">
                  {picksError}
                </Alert>
              ) : null}

              {!picksError && picks.length === 0 && !picksLoading ? (
                <p className="text-secondary mb-0" data-testid="picks-empty">
                  No combinations yet. Generate a Smart Pick for{' '}
                  {LOTTO_GAME_LABELS[game]}.
                </p>
              ) : null}

              {picks.length > 0 ? (
                <Row className="g-3" data-testid="smart-picks">
                  {picks.map((pick) => (
                    <Col md={4} key={pick.numbers.join('-')}>
                      <Card className="h-100 pick-card">
                        <Card.Body>
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {pick.numbers.map((number) => (
                              <span key={number} className="lotto-ball lotto-ball-pick">
                                {formatBall(number)}
                              </span>
                            ))}
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            <Badge bg="dark">Sum {pick.sum}</Badge>
                            <Badge bg="secondary">{pick.parity}</Badge>
                            <Badge bg="warning" text="dark">
                              {pick.hotCount} hot
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : null}
            </Card.Body>
          </Card>
        </section>
      </Container>
    </div>
  );
}
