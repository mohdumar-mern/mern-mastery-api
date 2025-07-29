// // controllers/vdoTokenController.js
// import axios from "axios";


// export const getVdoOtp = async (req, res) => {
//   const { videoId } = req.params;

//   try {
//     const response = await axios.post(
//       "https://dev.vdocipher.com/api/videos/otp",
//       {
//         videoId,
//         ttl: 300, // seconds for expiry
//       },
//       {
//         headers: {
//           Authorization: `Apisecret ${process.env.VDO_SECRET_KEY}`,
//         },
//       }
//     );

//     res.json(response.data);
//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to generate OTP" });
//   }
// };


// controllers/vdoController.js
import axios from "axios";


export const renderVideoPage = async (req, res) => {
  const { videoId } = req.params;

  try {
    const otpResponse = await axios.post(
      "https://dev.vdocipher.com/api/videos/otp",
      {
        videoId,
        ttl: 300,
      },
      {
        headers: {
          Authorization: `Apisecret ${process.env.VDO_SECRET_KEY}`,
        },
      }
    );

    const { otp, playbackInfo } = otpResponse.data;

    res.render("video", {
      title: "Secure VdoCipher Video",
      otp,
      playbackInfo,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Error generating OTP for video.");
  }
};
