import 'package:flutter/material.dart';

class SlimeBall extends StatelessWidget {
  final String? message;
  const SlimeBall({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        // The Slime Ball
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                Colors.blueAccent.shade100,
                Colors.blue.shade900,
              ],
              center: const Alignment(-0.3, -0.3),
              radius: 0.8,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.blueAccent.withOpacity(0.5),
                blurRadius: 20,
                spreadRadius: 5,
              ),
              BoxShadow(
                color: Colors.greenAccent.withOpacity(0.2), // Subtle hint of "slime" green/yellow mixed in
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ],
            border: Border.all(
              color: Colors.lightBlueAccent.withOpacity(0.5),
              width: 2,
            ),
          ),
          child: Container(
             decoration: BoxDecoration(
               shape: BoxShape.circle,
               gradient: LinearGradient(
                 begin: Alignment.topLeft,
                 end: Alignment.bottomRight,
                 colors: [
                   Colors.white.withOpacity(0.4),
                   Colors.transparent,
                 ],
               )
             ),
          ),
        ),
        
        // The Speech Bubble
        if (message != null && message!.isNotEmpty)
          Positioned(
            top: 0,
            right: -80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: const BoxConstraints(maxWidth: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(2, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    message!,
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                // Little tail for the bubble
                Padding(
                  padding: const EdgeInsets.only(left: 10),
                  child: CustomPaint(
                    painter: _TrianglePainter(Colors.white),
                    size: const Size(10, 8),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _TrianglePainter extends CustomPainter {
  final Color color;

  _TrianglePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, 0);
    path.lineTo(size.width, 0);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
