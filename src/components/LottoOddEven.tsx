import {
  Alert,
  Badge,
  Card,
  ProgressBar,
  Spinner,
} from 'react-bootstrap';
import BackendWakeupNotice from './BackendWakeupNotice';
import { useLottoOddEven } from '../hooks/useLottoOddEven';

export default function LottoOddEven({ game }: { game: string }) {
  const { data, loading, error } = useLottoOddEven(game);

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <Card.Title as="h2" className="h5 mb-1">
              Odd / Even Distribution
            </Card.Title>
            <Card.Text className="text-secondary mb-0">
              Draw patterns for {data?.gameName ?? game}
            </Card.Text>
          </div>
          {data ? (
            <Badge bg="dark" pill data-testid="odd-even-total">
              {data.totalDrawsAnalyzed.toLocaleString()} draws analyzed
            </Badge>
          ) : null}
        </div>

        {error ? (
          <Alert variant="danger" className="mb-0" data-testid="odd-even-error">
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <div
            className="d-flex align-items-center gap-3 py-3"
            data-testid="odd-even-loading"
          >
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading odd/even distribution</span>
            </Spinner>
            <div>
              <span>Loading odd/even distribution…</span>
              <BackendWakeupNotice testId="odd-even-backend-wakeup" />
            </div>
          </div>
        ) : null}

        {data && !loading ? (
          <div className="d-flex flex-column gap-3" data-testid="odd-even-patterns">
            {data.distribution.map((item) => (
              <div
                key={item.pattern}
                className="d-flex flex-column gap-2"
                data-testid="odd-even-pattern"
              >
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <span className="fw-semibold">{item.pattern}</span>
                  <Badge bg="primary" pill>
                    {item.count.toLocaleString()}
                  </Badge>
                </div>
                <ProgressBar
                  now={item.percentage}
                  label={`${item.percentage.toFixed(2)}%`}
                  aria-label={`${item.pattern} ${item.percentage}%`}
                  data-testid="odd-even-progress"
                />
              </div>
            ))}
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
