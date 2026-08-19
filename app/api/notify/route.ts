import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../db/db.config";
import Student from "../../../model/studentModel";

// SMSBangladesh API Configuration
const SMS_API_URL = process.env.SMS_PROVIDER;
const SMS_USER = process.env.SMS_BANGLADESH_USER || "";
const SMS_PASSWORD = process.env.SMS_BANGLADESH_PASSWORD || "";
const SMS_MASKING = process.env.SMS_BANGLADESH_MASKING || "ENGLISHAID";

// Helper: Format phone number to ensure it has 88 prefix
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // Remove non-digits
  if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned;
  } else if (!cleaned.startsWith("88")) {
    cleaned = "88" + cleaned;
  }
  return cleaned;
}

// Helper: Send SMS via SMSBangladesh API
async function sendSMSBangladesh(
  phoneNumbers: string[],
  message: string
): Promise<{ success: boolean; response?: string; error?: string; successCount?: number; failCount?: number }> {
  if (!SMS_USER || !SMS_PASSWORD) {
    console.warn("SMS credentials not configured. SMS not sent.");
    return { success: false, error: "SMS credentials not configured" };
  }

  try {
    // Format all phone numbers
    const formattedNumbers = phoneNumbers.map(formatPhoneNumber);
    const encodedMessage = encodeURIComponent(message);

    console.log("=== SMS API Request ===");
    console.log("To:", formattedNumbers);
    console.log("Message:", message);

    // Send SMS individually to each number to ensure delivery
    const results = await Promise.allSettled(
      formattedNumbers.map(async (phone) => {
        const apiUrl = `${SMS_API_URL}?user=${encodeURIComponent(SMS_USER)}&password=${encodeURIComponent(SMS_PASSWORD)}&to=${phone}&text=${encodedMessage}`;
        
        console.log(`Sending to ${phone}...`);
        const response = await fetch(apiUrl, { method: "GET" });
        const responseText = await response.text();
        
        console.log(`Response for ${phone}:`, responseText);
        
        // Check if response indicates success (adjust based on actual API response format)
        if (response.ok && !responseText.toLowerCase().includes("error") && !responseText.toLowerCase().includes("fail")) {
          return { phone, success: true, response: responseText };
        } else {
          throw new Error(responseText);
        }
      })
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failCount = results.filter(r => r.status === "rejected").length;

    console.log("=======================");
    console.log(`Success: ${successCount}, Failed: ${failCount}`);

    if (successCount > 0) {
      return { 
        success: true, 
        response: `Sent to ${successCount}/${formattedNumbers.length} numbers`,
        successCount,
        failCount
      };
    } else {
      return {
        success: false,
        error: "All SMS failed to send",
        successCount: 0,
        failCount: formattedNumbers.length
      };
    }
  } catch (error) {
    console.error("SMS API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// POST: Send notification via SMS
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    const { batch, batchName, message, phoneNumbers } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "No phone numbers provided" },
        { status: 400 }
      );
    }

    // Log the notification
    console.log("=== NOTIFICATION REQUEST ===");
    console.log("Batch:", batch || "All");
    console.log("Batch Name:", batchName || "All");
    console.log("Message:", message);
    console.log("Phone Numbers:", phoneNumbers);
    console.log("Total Recipients:", phoneNumbers.length);
    console.log("============================");

    // Send SMS via SMSBangladesh API
    const smsResult = await sendSMSBangladesh(phoneNumbers, message);

    if (smsResult.success) {
      return NextResponse.json(
        {
          success: true,
          message: `SMS sent to ${smsResult.successCount}/${phoneNumbers.length} recipient(s)`,
          details: {
            batch: batch || "All",
            batchName: batchName || "All",
            recipientCount: phoneNumbers.length,
            successCount: smsResult.successCount,
            failCount: smsResult.failCount,
            timestamp: new Date().toISOString(),
            apiResponse: smsResult.response,
          },
        },
        { status: 200 }
      );
    } else {
      // If SMS credentials are not configured, still return success but with warning
      if (smsResult.error === "SMS credentials not configured") {
        return NextResponse.json(
          {
            success: true,
            warning: "SMS credentials not configured. Message logged only.",
            message: `Notification logged for ${phoneNumbers.length} recipient(s)`,
            details: {
              batch: batch || "All",
              batchName: batchName || "All",
              recipientCount: phoneNumbers.length,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: "Failed to send SMS", details: smsResult.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

// GET: Get notification history (optional - for future use)
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: "Notification history not implemented yet" },
    { status: 200 }
  );
}
