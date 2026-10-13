import { ProblemStickers } from "./ProblemStickers";
import styles from "./Problem.module.css";

export function Problem() {
  return (
    <section className={styles.problem} id="about" data-problem aria-labelledby="problem-statement">
      <ProblemStickers />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>The problem: retail runs on memory</p>
        <h2 className={styles.statement} id="problem-statement">
          Shops run out of the products that sell best. Nobody can see what a shop really sells. Suppliers only deal
          with the distributor, and lenders cannot tell who is doing well. So the owner keeps a paper book, and finds
          out what went wrong after the month is over.
        </h2>
      </div>
    </section>
  );
}
