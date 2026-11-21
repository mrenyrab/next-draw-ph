import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  OverlayTrigger,
  ProgressBar,
  Row,
  Spinner,
  Table,
  Tooltip,
} from 'react-bootstrap';
import BackendWakeupNotice from './BackendWakeupNotice';
import { useLottoSumDistribution } from '../hooks/useLottoSumDistribution';

export default function LottoSumDistribution({ game }: { game: string }) {
  const { data, loading, error } = useLottoSumDistribution(game);
  const highestPercentage = data
    ? Math.max(...data.distribution.map((item) => item.percentage), -Infinity)
    : -Infinity;

  return (
    <Card
      className="h-100 border-0 shadow-sm"
      data-testid="sum-distribution-card"
    >
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <Card.Title as="h2" className="h5 mb-1">
              Sum Distribution
            </Card.Title>
            <Card.Text className="text-secondary mb-0">
              Draw sum ranges for {data?.gameName ?? game}
            </Card.Text>
          </div>
          {data ? (
            <Badge bg="dark" pill data-testid="sum-distribution-total">
              {data.totalDrawsAnalyzed.toLocaleString()} draws analyzed
            </Badge>
          ) : null}
        </div>

        {error ? (
          <Alert
            variant="danger"
            className="mb-0"
            data-testid="sum-distribution-error"
          >
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <div
            className="d-flex align-items-center gap-3 py-3"
            data-testid="sum-distribution-loading"
          >
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading sum distribution</span>
            </Spinner>
            <div>
              <span>Loading sum distribution…</span>
              <BackendWakeupNotice testId="sum-distribution-backend-wakeup" />
            </div>
          </div>
        ) : null}

        {data && !loading ? (
          <Row className="g-4" data-testid="sum-distribution-content">
            <Col lg={5}>
              <h3 className="h6 mb-3">Draw ranges</h3>
              <div
                className="d-flex flex-column gap-3"
                data-testid="sum-distribution-bars"
              >
                {data.distribution.map((item) => {
                  const isMostCommon = item.percentage === highestPercentage;

                  return (
                    <div
                      key={item.range}
                      className="d-flex flex-column gap-2"
                      data-testid="sum-distribution-bar-row"
                    >
                      <div className="d-flex justify-content-between align-items-center gap-3">
                        <span className="fw-semibold">{item.range}</span>
                        <Badge
                          bg={isMostCommon ? 'warning' : 'secondary'}
                          text={isMostCommon ? 'dark' : undefined}
                          pill
                        >
                          {item.percentage.toFixed(2)}%
                        </Badge>
                      </div>
                      <ProgressBar
                        now={item.percentage}
                        variant={isMostCommon ? 'warning' : 'info'}
                        aria-label={`${item.range} ${item.percentage}%`}
                        data-testid="sum-distribution-progress"
                      />
                    </div>
                  );
                })}
              </div>
            </Col>
            <Col lg={7}>
              <h3 className="h6 mb-3">Range details</h3>
              {data.distribution.length > 0 ? (
                <Table
                  responsive
                  hover
                  size="sm"
                  className="align-middle mb-0"
                  data-testid="sum-distribution-table"
                >
                  <thead>
                    <tr>
                      <th scope="col">Sum range</th>
                      <th scope="col" className="text-end">
                        Draws
                      </th>
                      <th scope="col" className="text-center">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.distribution.map((item, index) => (
                      <tr
                        key={item.range}
                        data-testid="sum-distribution-table-row"
                      >
                        <th scope="row">{item.range}</th>
                        <td className="text-end">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="text-center">
                          <OverlayTrigger
                            placement="top"
                            trigger={['hover', 'focus']}
                            overlay={
                              <Tooltip
                                id={`sum-range-tooltip-${index}`}
                                data-testid="sum-range-tooltip"
                              >
                                <span className="d-block">
                                  Minimum: {item.minSum}
                                </span>
                                <span className="d-block">
                                  Maximum: {item.maxSum}
                                </span>
                                <span className="d-block">
                                  Average: {item.avgSum.toFixed(1)}
                                </span>
                              </Tooltip>
                            }
                          >
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-secondary text-decoration-none"
                              aria-label={`Details for ${item.range}`}
                            >
                              <span
                                className="d-inline-flex align-items-center justify-content-center rounded-circle border"
                                style={{ width: '1.25rem', height: '1.25rem' }}
                                aria-hidden="true"
                              >
                                i
                              </span>
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-secondary mb-0">
                  No sum ranges are available for this game yet.
                </p>
              )}
            </Col>
          </Row>
        ) : null}
      </Card.Body>
    </Card>
  );
}
