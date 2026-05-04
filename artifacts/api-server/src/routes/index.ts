import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import geoRouter from "./geo";
import placesRouter from "./places";
import expertsRouter from "./experts";
import complaintsRouter from "./complaints";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/geo", geoRouter);
router.use("/places", placesRouter);
router.use("/experts", expertsRouter);
router.use("/complaints", complaintsRouter);
router.use("/stats", statsRouter);

export default router;
