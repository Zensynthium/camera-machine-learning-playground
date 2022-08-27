import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from 'scatter-gl';

import * as params from "./params";

// These anchor points allow the pose pointcloud to resize according to its
// position in the input.
const ANCHOR_POINTS = [[0, 0, 0], [0, 1, 0], [-1, 0, 0], [-1, -1, 0]];

// For some unknown reason the canvas being drawn is shifted on the x & y axis on desktop and ios in different ways. 
// There seems to be no indication of why this is occuring and until I figure that out we'll use this offset.

// Since the offset quite likely depends on whatever the screeensize is, this is likely going to be some kind of parameter we're going to have to pass in
const X_OFFSET = 0; //-20;
const Y_OFFSET = 0; //-36;

export default function (canvasContext) {
  // #ffffff - White
  // #800000 - Maroon
  // #469990 - Malachite
  // #e6194b - Crimson
  // #42d4f4 - Picton Blue
  // #fabed4 - Cupid
  // #aaffc3 - Mint Green
  // #9a6324 - Kumera
  // #000075 - Navy Blue
  // #f58231 - Jaffa
  // #4363d8 - Royal Blue
  // #ffd8b1 - Caramel
  // #dcbeff - Mauve
  // #808000 - Olive
  // #ffe119 - Candlelight
  // #911eb4 - Seance
  // #bfef45 - Inchworm
  // #f032e6 - Razzle Dazzle Rose
  // #3cb44b - Chateau Green
  // #a9a9a9 - Silver Chalice

  const COLOR_PALETTE = [
    "#ffffff",
    "#800000",
    "#469990",
    "#e6194b",
    "#42d4f4",
    "#fabed4",
    "#aaffc3",
    "#9a6324",
    "#000075",
    "#f58231",
    "#4363d8",
    "#ffd8b1",
    "#dcbeff",
    "#808000",
    "#ffe119",
    "#911eb4",
    "#bfef45",
    "#f032e6",
    "#3cb44b",
    "#a9a9a9",
  ];

  /**
   * Draw the keypoints and skeleton on the video.
   * @param poses A list of poses to render.
   */
  const drawResults = (poses) => {
    for (const pose of poses) {
      drawResult(pose);
    }
  };

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  const drawResult = (pose) => {
    if (pose.keypoints != null) {
      drawKeypoints(pose.keypoints);
      drawSkeleton(pose.keypoints, pose.id);
    }
    if (pose.keypoints3D != null && params.STATE.modelConfig.render3D) {
      drawKeypoints3D(pose.keypoints3D);
    }
  };

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  const drawKeypoints = (keypoints) => {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      params.STATE.model
    );
    canvasContext.fillStyle = "Red";
    canvasContext.strokeStyle = "White";
    canvasContext.lineWidth = params.DEFAULT_LINE_WIDTH;

    for (const i of keypointInd.middle) {
      drawKeypoint(keypoints[i]);
    }

    canvasContext.fillStyle = "Green";
    for (const i of keypointInd.left) {
      drawKeypoint(keypoints[i]);
    }

    canvasContext.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      drawKeypoint(keypoints[i]);
    }
  };

  const drawKeypoint = (keypoint) => {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x + X_OFFSET, keypoint.y + Y_OFFSET, params.DEFAULT_RADIUS, 0, 2 * Math.PI);
      canvasContext.fill(circle);
      canvasContext.stroke(circle);
    }
  };

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  const drawSkeleton = (keypoints, poseId) => {
    // Each poseId is mapped to a color in the color palette.
    const color =
      params.STATE.modelConfig.enableTracking && poseId != null
        ? COLOR_PALETTE[poseId % 20]
        : "White";
    canvasContext.fillStyle = color;
    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = params.DEFAULT_LINE_WIDTH;

    posedetection.util
      .getAdjacentPairs(params.STATE.model)
      .forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
          canvasContext.beginPath();
          canvasContext.moveTo(kp1.x + X_OFFSET, kp1.y + Y_OFFSET);
          canvasContext.lineTo(kp2.x + X_OFFSET, kp2.y + Y_OFFSET);
          canvasContext.stroke();
        }
      });
  };

  const drawKeypoints3D = (keypoints) => {
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;
    const pointsData = keypoints.map((keypoint) => [
      -keypoint.x,
      -keypoint.y,
      -keypoint.z,
    ]);

    const dataset = new scatter.ScatterGL.Dataset([
      ...pointsData,
      ...ANCHOR_POINTS,
    ]);

    const keypointInd = posedetection.util.getKeypointIndexBySide(
      params.STATE.model
    );
    this.scatterGL.setPointColorer((i) => {
      if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
        // hide anchor points and low-confident points.
        return "#ffffff";
      }
      if (i === 0) {
        return "#ff0000" /* Red */;
      }
      if (keypointInd.left.indexOf(i) > -1) {
        return "#00ff00" /* Green */;
      }
      if (keypointInd.right.indexOf(i) > -1) {
        return "#ffa500" /* Orange */;
      }
    });

    if (!this.scatterGLHasInitialized) {
      this.scatterGL.render(dataset);
    } else {
      this.scatterGL.updateDataset(dataset);
    }
    const connections = posedetection.util.getAdjacentPairs(params.STATE.model);
    const sequences = connections.map((pair) => ({ indices: pair }));
    this.scatterGL.setSequences(sequences);
    this.scatterGLHasInitialized = true;
  };

  return { drawResults };
}
