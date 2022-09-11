export default interface ICrawlHander {
    kwd: string;

    crawl: () => Promise<unknown>;
}