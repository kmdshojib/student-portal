"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, MessageSquare, CheckCircle2, AlertCircle, Phone, User, Loader2 } from "lucide-react";

interface Student {
  _id: string;
  fullName: string;
  guardianName: string;
  phoneNumber: string;
  guardianPhoneNumber?: string;
  batch: string;
  batchName: string;
}

export default function NotifyPage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedBatchName, setSelectedBatchName] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Fetch batches and batch names on mount
  useEffect(() => {
    fetch("/api/students/batches")
      .then((res) => res.json())
      .then((data) => {
        setBatches(data.batches || []);
        setBatchNames(data.batchNames || []);
      })
      .catch(() => {
        setBatches([]);
        setBatchNames([]);
      });
  }, []);

  // Fetch students when batch or batchName changes
  useEffect(() => {
    let url = "/api/students";
    const params = new URLSearchParams();
    
    if (selectedBatch && selectedBatch !== "all") {
      params.append("batch", selectedBatch);
    }
    if (selectedBatchName && selectedBatchName !== "all") {
      params.append("batchName", selectedBatchName);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data || []);
      })
      .catch(() => {
        setStudents([]);
      });
  }, [selectedBatch, selectedBatchName]);

  // Filter batch names based on selected batch
  const filteredBatchNames = selectedBatch && selectedBatch !== "all"
    ? [...new Set(students.filter(s => s.batch === selectedBatch).map(s => s.batchName))]
    : batchNames;

  // Get recipient count
  const recipientCount = selectedStudent !== "all" ? 1 : students.length;

  // Get selected student object
  const selectedStudentObj = students.find(s => s._id === selectedStudent);

  // Get phone numbers for sending - only student numbers
  const getPhoneNumbers = () => {
    const phones: string[] = [];
    
    if (selectedStudent !== "all" && selectedStudentObj) {
      // Single student selected
      if (selectedStudentObj.phoneNumber) phones.push(selectedStudentObj.phoneNumber);
    } else {
      // All students in batch
      students.forEach((student) => {
        if (student.phoneNumber) phones.push(student.phoneNumber);
      });
    }
    return [...new Set(phones)]; // Remove duplicates
  };

  // Send SMS via API
  const handleSendSMS = async () => {
    if (!message.trim()) {
      setResult({ success: false, message: "Please enter a message" });
      return;
    }

    const phoneNumbers = getPhoneNumbers();
    if (phoneNumbers.length === 0) {
      setResult({ success: false, message: "No phone numbers found" });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batch: selectedBatch !== "all" ? selectedBatch : undefined,
          batchName: selectedBatchName !== "all" ? selectedBatchName : undefined,
          phoneNumbers: phoneNumbers,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.warning 
            ? `${data.message} (${data.warning})`
            : `SMS sent successfully to ${data.details?.recipientCount || phoneNumbers.length} recipient(s)`,
        });
        setMessage(""); // Clear message on success
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to send SMS",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Send Notification
            </h1>
            <p className="text-gray-600">
              Send SMS messages to students batch-wise
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Compose Message
            </CardTitle>
            <CardDescription>
              Select a batch and compose your SMS message to send
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Batch Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch Type
                </label>
                <Select value={selectedBatch} onValueChange={(value) => {
                  setSelectedBatch(value);
                  setSelectedBatchName("all");
                  setSelectedStudent("all");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch} value={batch}>
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch Name
                </label>
                <Select value={selectedBatchName} onValueChange={(value) => {
                  setSelectedBatchName(value);
                  setSelectedStudent("all");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Batch Names" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batch Names</SelectItem>
                    {filteredBatchNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student (Optional)
                </label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipients Info */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              {selectedStudent !== "all" ? (
                <User className="w-5 h-5 text-blue-600" />
              ) : (
                <Users className="w-5 h-5 text-blue-600" />
              )}
              <div>
                {selectedStudent !== "all" && selectedStudentObj ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {selectedStudentObj.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getPhoneNumbers().length} phone number{getPhoneNumbers().length !== 1 ? "s" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">
                      {recipientCount} Student{recipientCount !== 1 ? "s" : ""} Selected
                    </p>
                    <p className="text-sm text-gray-600">
                      {getPhoneNumbers().length} phone number{getPhoneNumbers().length !== 1 ? "s" : ""} will receive this message
                    </p>
                  </>
                )}
              </div>
              {selectedBatch !== "all" && (
                <Badge className="ml-auto">{selectedBatch}</Badge>
              )}
              {selectedBatchName !== "all" && (
                <Badge variant="outline">{selectedBatchName}</Badge>
              )}
            </div>

            {/* Message Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <Textarea
                placeholder="Type your SMS message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {message.length} characters
              </p>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`flex items-center gap-2 p-4 rounded-lg ${
                  result.success
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p>{result.message}</p>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleSendSMS}
              disabled={!message.trim() || recipientCount === 0 || isSending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Send SMS
                </>
              )}
            </Button>

            {/* Phone Numbers Preview */}
            {recipientCount > 0 && (
              <div className="mt-4 text-center">
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    const phones = getPhoneNumbers();
                    alert(`Phone Numbers (${phones.length}):\n\n${phones.join('\n')}`);
                  }}
                >
                  View all {getPhoneNumbers().length} phone numbers
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
