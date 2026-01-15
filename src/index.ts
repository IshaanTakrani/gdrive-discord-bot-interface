import { run_bot } from "./services/bot";

try {
  run_bot();
} catch (error) {
  console.error(error);
}
