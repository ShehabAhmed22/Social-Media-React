export class Pagination {
  constructor({ page = 1, limit = 10, total = 0 } = {}) {
    this.page = Math.max(1, parseInt(page));
    this.limit = Math.min(100, Math.max(1, parseInt(limit)));
    this.total = parseInt(total);
    this.totalPages = Math.ceil(this.total / this.limit);
    this.skip = (this.page - 1) * this.limit;
  }

  get prismaArgs() {
    return { skip: this.skip, take: this.limit };
  }

  getMeta() {
    return {
      total: this.total,
      page: this.page,
      limit: this.limit,
      totalPages: this.totalPages,
      hasNextPage: this.page < this.totalPages,
      hasPrevPage: this.page > 1,
    };
  }
}
