// File: lib/pages/exam/script_uploader_page.dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb; // ✅ Check for Web
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ScriptUploaderPage extends StatefulWidget {
  const ScriptUploaderPage({super.key});

  @override
  State<ScriptUploaderPage> createState() => _ScriptUploaderPageState();
}

class _ScriptUploaderPageState extends State<ScriptUploaderPage> {
  // ✅ Change File? to XFile? (Cross-platform compatible)
  XFile? _pickedFile;
  final ImagePicker _picker = ImagePicker();
  bool _isConverting = false;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (picked != null) {
        setState(() {
          _pickedFile = picked;
        });
      }
    } catch (e) {
      debugPrint("Error picking image: $e");
    }
  }

  Future<void> _handleConfirm() async {
    if (_pickedFile == null) return;

    setState(() {
      _isConverting = true;
    });

    try {
      // ✅ readAsBytes() works on BOTH Mobile and Web
      List<int> imageBytes = await _pickedFile!.readAsBytes();
      String base64Image = base64Encode(imageBytes);
      String finalData = "data:image/jpeg;base64,$base64Image";

      if (mounted) {
        Navigator.pop(context, finalData);
      }
    } catch (e) {
      debugPrint("Error converting image: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isConverting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text("OMR স্ক্রিপ্ট আপলোড"),
        backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
      ),
      backgroundColor: isDark
          ? const Color(0xFF000000)
          : const Color(0xFFF1F5F9),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Instructions
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.indigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.indigo.withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.indigo),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "আপনার পূরণ করা OMR শিটের একটি পরিষ্কার ছবি তুলুন বা গ্যালারি থেকে নির্বাচন করুন।",
                          style: TextStyle(color: Colors.indigo),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Drop Zone / Image Preview
                Expanded(
                  child: GestureDetector(
                    onTap: () => _showPickerOptions(context),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF121212) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: _pickedFile != null
                              ? Colors.indigo
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                      ),
                      child: _pickedFile != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(22),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  // ✅ FIX: Use kIsWeb to decide how to render
                                  kIsWeb
                                      ? Image.network(
                                          _pickedFile!.path,
                                          fit: BoxFit.contain,
                                        )
                                      : Image.file(
                                          File(_pickedFile!.path),
                                          fit: BoxFit.contain,
                                        ),

                                  Container(
                                    color: Colors.black.withOpacity(0.3),
                                    child: const Center(
                                      child: Icon(
                                        Icons.edit,
                                        color: Colors.white,
                                        size: 48,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.indigo.withOpacity(0.2)
                                        : Colors.indigo.shade50,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.add_a_photo_outlined,
                                    size: 48,
                                    color: Colors.indigo,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  "ছবি নির্বাচন করতে ট্যাপ করুন",
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? Colors.grey[300]
                                        : Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("বাতিল"),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: (_pickedFile == null || _isConverting)
                            ? null
                            : _handleConfirm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo,
                          foregroundColor: Colors.white,
                        ),
                        child: _isConverting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                ),
                              )
                            : const Text("আপলোড করুন"),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showPickerOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('গ্যালারি (Gallery)'),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('ক্যামেরা (Camera)'),
              onTap: () {
                Navigator.of(context).pop();
                _pickImage(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }
}
