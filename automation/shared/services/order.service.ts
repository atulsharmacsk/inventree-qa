import type { APIRequestContext, APIResponse } from '@playwright/test';
import { deleteWithRetry } from '../cleanup';
import { DEFAULT_PAGE_LIMIT, type NewOrder, type NewOrderLine, type Order, type OrderKind, type OrderLine, type Page } from '../models';

/** Sends requests to /api/order/po/ or /api/order/so/ and their line items, and remembers the orders a test creates; lines are deleted with their order. */
export class OrderService {
  private createdIds: number[] = [];
  private readonly endpoint: string;
  private readonly lineEndpoint: string;

  constructor(private request: APIRequestContext, private kind: OrderKind) {
    this.endpoint = `/api/order/${kind}/`;
    this.lineEndpoint = `/api/order/${kind}-line/`;
  }

  async create(order: NewOrder): Promise<APIResponse> {
    const response = await this.request.post(this.endpoint, { data: order });
    if (response.status() === 201) this.createdIds.push(((await response.json()) as Order).pk);
    return response;
  }

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`${this.endpoint}${id}/`);
  }

  createLine(line: NewOrderLine): Promise<APIResponse> {
    return this.request.post(this.lineEndpoint, { data: line });
  }

  /** For test checks: lists an order's line items and stops the test if that fails. */
  async listLinesOrFail(orderId: number): Promise<Page<OrderLine>> {
    const response = await this.request.get(this.lineEndpoint, { params: { order: orderId, limit: DEFAULT_PAGE_LIMIT } });
    if (response.status() !== 200) {
      throw new Error(`Could not list ${this.kind} order lines: ${response.status()}`);
    }
    return (await response.json()) as Page<OrderLine>;
  }

  /** For test setup: creates an order and stops the test if that fails. */
  async createOrFail(order: NewOrder): Promise<Order> {
    const response = await this.create(order);
    if (response.status() !== 201) {
      throw new Error(`Could not create ${this.kind} order: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()) as Order;
  }

  /** Deletes only the orders this test created and returns any failures. */
  async deleteCreated(): Promise<string[]> {
    const failures: string[] = [];
    for (const id of [...this.createdIds].reverse()) {
      const response = await deleteWithRetry(() => this.delete(id));
      if (response.status() !== 204 && response.status() !== 404) {
        failures.push(`Deleting ${this.kind} order ${id} returned ${response.status()}`);
      }
    }
    this.createdIds = [];
    return failures;
  }
}
