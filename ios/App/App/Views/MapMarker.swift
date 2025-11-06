import SwiftUI

struct MapMarker: View {
    let number: String
    
    var body: some View {
        ZStack {
            markerShape
            
            Text(number)
                .font(.custom("Poppins-SemiBold", size: 10))
                .foregroundColor(.white)
                .offset(y: -2)
        }
        .frame(width: 25, height: 25)
    }
    
    private var markerShape: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12.5)
                .fill(Color.black)
                .frame(width: 25, height: 25)
                .cornerRadius(12.5, corners: [.topLeft, .topRight, .bottomRight])
        }
        .rotationEffect(.degrees(45))
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview {
    VStack(spacing: 20) {
        MapMarker(number: "1")
        MapMarker(number: "3")
        MapMarker(number: "4")
        MapMarker(number: "6")
    }
    .padding()
    .background(Color.gray.opacity(0.2))
}
